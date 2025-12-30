import { Redis } from "@upstash/redis";
import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { jsonError } from "@/server/security/http";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
};

type WindowState = {
  count: number;
  resetAtMs: number;
};

type RedisConfig = {
  url: string;
  token: string;
};

const windows = new Map<string, WindowState>();
const limiterCache = new Map<string, Ratelimit>();
const redis = (() => {
  const config = getRedisConfig();
  if (!config) return null;
  return new Redis({ url: config.url, token: config.token });
})();

export function resetRateLimitsForTests() {
  windows.clear();
}

function getRedisConfig(): RedisConfig | null {
  const url =
    process.env.RATE_LIMIT_REDIS_URL ??
    process.env.UPSTASH_REDIS_REST_URL ??
    "";
  const token =
    process.env.RATE_LIMIT_REDIS_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    "";
  if (!url || !token) return null;
  return { url, token };
}

function formatWindow(windowMs: number): Duration {
  if (windowMs % 60_000 === 0) {
    return `${windowMs / 60_000} m` as Duration;
  }
  if (windowMs % 1_000 === 0) {
    return `${windowMs / 1_000} s` as Duration;
  }
  return `${Math.ceil(windowMs / 1_000)} s` as Duration;
}

function getLimiter(limit: number, windowMs: number) {
  const key = `${limit}:${windowMs}`;
  const existing = limiterCache.get(key);
  if (existing) return existing;
  if (!redis) return null;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, formatWindow(windowMs)),
  });
  limiterCache.set(key, limiter);
  return limiter;
}

function rateLimitInMemory({
  key,
  limit,
  windowMs,
  nowMs = Date.now(),
}: {
  key: string;
  limit: number;
  windowMs: number;
  nowMs?: number;
}): RateLimitResult {
  const existing = windows.get(key);
  if (!existing || existing.resetAtMs <= nowMs) {
    const next: WindowState = { count: 1, resetAtMs: nowMs + windowMs };
    windows.set(key, next);
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAtMs: next.resetAtMs };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    resetAtMs: existing.resetAtMs,
  };
}

export async function rateLimit({
  key,
  limit,
  windowMs,
  nowMs = Date.now(),
}: {
  key: string;
  limit: number;
  windowMs: number;
  nowMs?: number;
}): Promise<RateLimitResult> {
  if (!redis) {
    return rateLimitInMemory({ key, limit, windowMs, nowMs });
  }

  const limiter = getLimiter(limit, windowMs);
  if (!limiter) {
    return rateLimitInMemory({ key, limit, windowMs, nowMs });
  }

  const result = await limiter.limit(key);
  const resetAtMs = Number(result.reset);
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAtMs,
  };
}

export async function enforceRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const result = await rateLimit({ key, limit, windowMs });
  if (result.allowed) return null;

  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAtMs - Date.now()) / 1000));
  const res = jsonError(429, "Rate limit exceeded", { retryAfterSeconds });
  res.headers.set("Retry-After", String(retryAfterSeconds));
  return res;
}

function firstCommaSeparated(value: string) {
  return value.split(",")[0]?.trim() ?? "";
}

function shouldTrustProxy() {
  const override = process.env.TRUST_PROXY;
  if (override === "true") return true;
  if (override === "false") return false;
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}

export function getClientIp(headers: Headers) {
  if (shouldTrustProxy()) {
    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) return firstCommaSeparated(xForwardedFor) || "unknown";

    const forwarded = headers.get("forwarded");
    if (forwarded) {
      const match = /for="?([^;,\"]+)"?/i.exec(forwarded);
      if (match?.[1]) return match[1];
    }

    return (
      headers.get("x-real-ip") ??
      headers.get("cf-connecting-ip") ??
      headers.get("true-client-ip") ??
      "unknown"
    );
  }

  return "unknown";
}

export function getRequestOrigin(headers: Headers) {
  const origin = headers.get("origin");
  if (origin) return origin;

  const referer = headers.get("referer");
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function getAllowedOrigins() {
  const raw =
    process.env.ALLOWED_ORIGINS ??
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    "";

  const candidates = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const origins: string[] = [];
  for (const candidate of candidates) {
    try {
      origins.push(new URL(candidate).origin);
    } catch {
      origins.push(candidate);
    }
  }

  return Array.from(new Set(origins));
}

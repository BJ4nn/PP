import { jsonError } from "@/server/security/http";
import { getAllowedOrigins, getRequestOrigin } from "@/server/security/request";

function shouldEnforceCsrf() {
  if (process.env.CSRF_ENFORCE === "true") return true;
  return process.env.NODE_ENV === "production";
}

function isSafeMethod(method: string) {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

export function enforceCsrfSameOrigin(request: Request) {
  if (isSafeMethod(request.method)) return null;
  if (!shouldEnforceCsrf()) return null;

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.length === 0) {
    return jsonError(500, "CSRF protection misconfigured");
  }

  const origin = getRequestOrigin(request.headers);
  if (!origin) {
    return jsonError(403, "CSRF blocked");
  }

  if (!allowedOrigins.includes(origin)) {
    return jsonError(403, "CSRF blocked");
  }

  return null;
}


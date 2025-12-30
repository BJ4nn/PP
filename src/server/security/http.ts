export function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}


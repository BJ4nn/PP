import http from "node:http";
import { URL } from "node:url";

const port = Number(process.env.SECURITY_LAB_PORT || 4001);
const targetOrigin = process.env.SECURITY_LAB_TARGET_ORIGIN || "http://localhost:3000";

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Security Lab (Manual Click Tests)</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; max-width: 900px; margin: 0 auto; }
      code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
      .row { display: flex; gap: 12px; flex-wrap: wrap; }
      button { padding: 10px 12px; border-radius: 10px; border: 1px solid #ddd; background: #fff; cursor: pointer; }
      button:hover { background: #f6f6f6; }
      .card { border: 1px solid #eee; border-radius: 12px; padding: 16px; margin: 16px 0; }
      .hint { color: #555; font-size: 14px; }
      pre { background: #0b1020; color: #e6e6e6; padding: 12px; border-radius: 10px; overflow: auto; }
    </style>
  </head>
  <body>
    <h1>Security Lab (manual “simulate user” checks)</h1>
    <p class="hint">
      This page is served from a different origin (<code>http://localhost:${port}</code>) to simulate a malicious site.
      Log in to the app at <code>${targetOrigin}</code> first, then click actions here.
    </p>

    <div class="card">
      <h2>Setup</h2>
      <ol>
        <li>Start DB: <code>docker-compose up -d db</code></li>
        <li>Run migrations + seed: <code>npm run db:deploy</code> and <code>npm run db:seed</code></li>
        <li>Start app: <code>npm run dev:next</code> (or your usual dev command)</li>
        <li>(Optional) force CSRF guard in dev: <code>CSRF_ENFORCE=true</code></li>
        <li>Open app and login: <code>worker@demo.local</code> / <code>Heslo123</code> or <code>company@demo.local</code> / <code>Heslo123</code></li>
      </ol>
    </div>

    <div class="card">
      <h2>CSRF attempts (should be 403 when logged in)</h2>
      <div class="row">
        <button data-action="csrf-notifications-mark-read">POST /api/notifications/mark-read</button>
        <button data-action="csrf-worker-ready">PATCH /api/worker/ready</button>
        <button data-action="csrf-worker-prefs">PATCH /api/worker/prefs</button>
        <button data-action="csrf-company-jobs-create">POST /api/company/jobs</button>
      </div>
      <p class="hint">Expected: <code>403</code> with <code>{"error":"CSRF blocked"}</code> when logged in.</p>
    </div>

    <div class="card">
      <h2>Rate limit (should become 429)</h2>
      <div class="row">
        <button data-action="rate-register">Spam POST /api/auth/register (11x)</button>
      </div>
      <p class="hint">Expected: first calls <code>200</code>, then <code>429</code> with <code>Retry-After</code>.</p>
    </div>

    <div class="card">
      <h2>Output</h2>
      <pre id="out"></pre>
    </div>

    <script>
      const targetOrigin = ${JSON.stringify(targetOrigin)};
      const out = document.getElementById("out");
      function log(line) {
        out.textContent += line + "\\n";
        out.scrollTop = out.scrollHeight;
      }
      async function request(path, init) {
        const url = targetOrigin + path;
        const res = await fetch(url, {
          ...init,
          credentials: "include",
        });
        const text = await res.text().catch(() => "");
        return {
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          body: text,
        };
      }

      const actions = {
        async "csrf-notifications-mark-read"() {
          return request("/api/notifications/mark-read", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ids: ["ckl2u8f3p000001l0g3h4a1b2"] }),
          });
        },
        async "csrf-worker-ready"() {
          return request("/api/worker/ready", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ isReady: true }),
          });
        },
        async "csrf-worker-prefs"() {
          return request("/api/worker/prefs", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ noticePreference: "H24" }),
          });
        },
        async "csrf-company-jobs-create"() {
          const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          return request("/api/company/jobs", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              title: "CSRF test job",
              description: "Created from malicious origin",
              locationCity: "Bratislava",
              region: "BA",
              warehouseType: "WAREHOUSE",
              startsAt,
              durationHours: 4,
              hourlyRate: 15,
              requiredVzv: false,
              neededWorkers: 1,
              noticeWindow: "H24",
            }),
          });
        },
        async "rate-register"() {
          const results = [];
          for (let i = 0; i < 11; i += 1) {
            const email = "rate-test-" + i + "@example.com";
            results.push(
              await request("/api/auth/register", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, password: "password123", role: "WORKER" }),
              }),
            );
          }
          return { status: 200, headers: {}, body: JSON.stringify(results, null, 2) };
        },
      };

      document.addEventListener("click", async (e) => {
        const button = e.target.closest("button[data-action]");
        if (!button) return;
        const action = button.getAttribute("data-action");
        log("> " + action);
        try {
          const result = await actions[action]();
          log("status: " + result.status);
          log("headers: " + JSON.stringify(result.headers, null, 2));
          log("body: " + result.body);
        } catch (err) {
          log("error: " + (err && err.message ? err.message : String(err)));
        }
        log("");
      });
    </script>
  </body>
</html>`;

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    if (url.pathname !== "/") {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  } catch {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Internal error");
  }
});

server.listen(port, () => {
  console.log(`Security Lab running at http://localhost:${port}`);
  console.log(`Target origin: ${targetOrigin}`);
});

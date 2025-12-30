import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
    };
  } catch {
    return null;
  }
}

function spawnInherit(command, args) {
  const child = spawn(command, args, { stdio: "inherit" });
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

function spawnQuiet(command, args) {
  const child = spawn(command, args, { stdio: "ignore" });
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

function isTcpOpen(host, port, timeoutMs = 500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
    socket.connect(port, host);
  });
}

async function waitForTcp(host, port, totalTimeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < totalTimeoutMs) {
    const open = await isTcpOpen(host, port);
    if (open) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function runDockerCompose(args) {
  // Prefer legacy `docker-compose` if present; otherwise try `docker compose`.
  const hasLegacy = (await spawnQuiet("docker-compose", ["version"])) === 0;
  if (hasLegacy) {
    return spawnInherit("docker-compose", args);
  }

  const hasPlugin = (await spawnQuiet("docker", ["compose", "version"])) === 0;
  if (hasPlugin) {
    return spawnInherit("docker", ["compose", ...args]);
  }

  console.error(
    "\nDocker Compose nie je dostupný. Nainštaluj buď `docker-compose`, alebo Docker Compose plugin (`docker compose`).\n",
  );
  return 1;
}

async function runPrismaMigrateDeploy() {
  const generateExitCode = await spawnInherit("npx", ["prisma", "generate"]);
  if (generateExitCode !== 0) {
    console.error(
      "\nNepodarilo sa spustiť `prisma generate`. Skús ručne: `npx prisma generate`\n",
    );
    process.exit(generateExitCode);
  }

  const exitCode = await spawnInherit("npx", ["prisma", "migrate", "deploy"]);
  if (exitCode !== 0) {
    console.error(
      "\nNepodarilo sa aplikovať Prisma migrácie. Skús ručne:\n" +
        "- `npx prisma migrate deploy`\n" +
        "- alebo `npm run db:migrate`\n",
    );
    process.exit(exitCode);
  }
}

async function runSeedIfEmpty() {
  const exitCode = await spawnInherit("node", ["scripts/seed.mjs"]);
  if (exitCode !== 0) {
    console.error(
      "\nSeed pre dev DB zlyhal. Skús ručne: `node scripts/seed.mjs`\n",
    );
    process.exit(exitCode);
  }
}

function runNextDev() {
  const child = spawn("npm", ["run", "-s", "dev:next"], { stdio: "inherit" });
  const forward = (signal) => child.kill(signal);
  process.on("SIGINT", forward);
  process.on("SIGTERM", forward);
  child.on("exit", (code) => process.exit(code ?? 1));
}

async function main() {
  loadDotEnv();
  const databaseUrl = process.env.DATABASE_URL;
  const parsed = databaseUrl ? parseDatabaseUrl(databaseUrl) : null;

  const dbHost = parsed?.host ?? "localhost";
  const dbPort = parsed?.port ?? 5432;

  const shouldTryCompose =
    dbHost === "localhost" || dbHost === "127.0.0.1" || dbHost === "::1";

  const dbAlreadyUp = await isTcpOpen(dbHost, dbPort);
  const startedDbViaCompose = !dbAlreadyUp && shouldTryCompose;

  if (startedDbViaCompose) {
    const composeExitCode = await runDockerCompose(["up", "-d", "db"]);
    if (composeExitCode !== 0) {
      console.error(
        "\nDev databázu sa nepodarilo spustiť automaticky.\n" +
          "- Uisti sa, že máš nainštalovaný Docker a beží Docker daemon.\n" +
          "- Alebo spusti lokálny Postgres na " +
          `${dbHost}:${dbPort}.\n`,
      );
      process.exit(composeExitCode);
    }

    const ready = await waitForTcp(dbHost, dbPort);
    if (!ready) {
      console.error(
        `\nPostgres sa nespustil včas na ${dbHost}:${dbPort}. Skús: docker compose logs db\n`,
      );
      process.exit(1);
    }
  }

  // Always ensure schema + at least demo users exist.
  // `migrate deploy` is idempotent and `seed.mjs` no-ops when users exist.
  await runPrismaMigrateDeploy();
  await runSeedIfEmpty();

  runNextDev();
}

await main();

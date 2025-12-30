import { spawn } from "node:child_process";

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

async function runDockerCompose(args) {
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

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("\nUsage: node scripts/docker-compose.mjs <args...>\n");
    process.exit(1);
  }
  const code = await runDockerCompose(args);
  process.exit(code);
}

await main();


import { spawn } from "node:child_process";

const hostname = process.env.CAPYFIN_DEV_SIDECAR_HOSTNAME || "127.0.0.1";
const port = process.env.CAPYFIN_DEV_SIDECAR_PORT || "19110";
const username = process.env.CAPYFIN_DEV_SIDECAR_USERNAME || "capyfin";
const password =
  process.env.CAPYFIN_DEV_SIDECAR_PASSWORD || "capyfin-dev-password";
const appPort = process.env.CAPYFIN_DEV_APP_PORT || "1510";

const sharedEnv = {
  ...process.env,
  CAPYFIN_SERVER_HOSTNAME: hostname,
  CAPYFIN_SERVER_PASSWORD: password,
  CAPYFIN_SERVER_PORT: port,
  CAPYFIN_SERVER_USERNAME: username,
  VITE_CAPYFIN_BROWSER_SIDECAR_PASSWORD: password,
  VITE_CAPYFIN_BROWSER_SIDECAR_USERNAME: username,
};

const children = [];
let isShuttingDown = false;

function spawnPnpm(args) {
  const child = spawn("pnpm", args, {
    cwd: process.cwd(),
    env: sharedEnv,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    for (const current of children) {
      if (current !== child && !current.killed) {
        current.kill("SIGTERM");
      }
    }

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });

  children.push(child);
  return child;
}

function shutdown() {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

spawnPnpm(["sidecar:dev"]);
spawnPnpm([
  "--filter",
  "@capyfin/desktop",
  "exec",
  "vite",
  "--host",
  "127.0.0.1",
  "--port",
  appPort,
  "--strictPort",
]);

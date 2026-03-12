import { startSidecarServer } from "./index";

function main(): void {
  const server = startSidecarServer();

  const shutdown = () => {
    console.error("[sidecar] shutting down");
    server.close();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();

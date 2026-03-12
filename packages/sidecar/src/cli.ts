import { serve } from "@hono/node-server";
import packageJson from "../package.json" with { type: "json" };
import { loadSidecarConfig } from "./config";
import { createSidecarApp } from "./server/app";

function main(): void {
  const config = loadSidecarConfig();
  const runtime = {
    config,
    startedAt: Date.now(),
    version: packageJson.version,
  };
  const app = createSidecarApp(runtime);

  const server = serve(
    {
      fetch: app.fetch,
      hostname: config.hostname,
      port: config.port,
    },
    (info) => {
      const port = String(info.port);
      console.error(
        `[sidecar] listening on http://${info.address}:${port} as ${config.username}`,
      );
    },
  );

  const shutdown = () => {
    console.error("[sidecar] shutting down");
    server.close();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();

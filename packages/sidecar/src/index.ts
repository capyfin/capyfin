import { serve } from "@hono/node-server";
import packageJson from "../package.json" with { type: "json" };
import { loadSidecarConfig, type SidecarConfig } from "./config";
import { createSidecarApp } from "./server/app";

export interface SidecarServerHandle {
  close(): void;
}

export function startSidecarServer(config: SidecarConfig = loadSidecarConfig()): SidecarServerHandle {
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

  return {
    close() {
      server.close();
    },
  };
}

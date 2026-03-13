import { AgentService } from "@capyfin/core/agents";
import { ProviderAuthService } from "@capyfin/core/auth";
import { serve } from "@hono/node-server";
import packageJson from "../package.json" with { type: "json" };
import { OAuthSessionManager } from "./auth/oauth-sessions.ts";
import { loadSidecarConfig, type SidecarConfig } from "./config.ts";
import { createSidecarApp } from "./server/app.ts";

export interface SidecarServerHandle {
  close(): void;
}

export function startSidecarServer(config: SidecarConfig = loadSidecarConfig()): SidecarServerHandle {
  const createAgentService = (): AgentService => new AgentService();
  const createAuthService = (): ProviderAuthService => new ProviderAuthService();
  const runtime = {
    authSessions: new OAuthSessionManager(createAuthService),
    config,
    createAgentService,
    createAuthService,
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

import { ProviderAuthService } from "@capyfin/core/auth";
import { serve } from "@hono/node-server";
import packageJson from "../package.json" with { type: "json" };
import { OAuthSessionManager } from "./auth/oauth-sessions.ts";
import { loadSidecarConfig, type SidecarConfig } from "./config.ts";
import { EmbeddedGatewayClient } from "./internal-gateway/gateway-client.ts";
import { AgentMetadataStoreService } from "./internal-gateway/metadata-store.ts";
import { EmbeddedGatewaySupervisor } from "./internal-gateway/supervisor.ts";
import { createSidecarApp } from "./server/app.ts";

export interface SidecarServerHandle {
  close(): Promise<void>;
}

export async function startSidecarServer(
  config: SidecarConfig = loadSidecarConfig(),
): Promise<SidecarServerHandle> {
  const authService = new ProviderAuthService();
  const gatewaySupervisor = new EmbeddedGatewaySupervisor(config);
  await gatewaySupervisor.start();
  const metadataStore = new AgentMetadataStoreService(gatewaySupervisor.paths);
  await metadataStore.ensureDefaultAgent();
  const embeddedGateway = new EmbeddedGatewayClient({
    authService,
    metadataStore,
    paths: gatewaySupervisor.paths,
    target: gatewaySupervisor.connection,
  });
  await embeddedGateway.syncAuthProfiles();
  const runtime = {
    authService,
    authSessions: new OAuthSessionManager(() => authService, {
      afterProfileStored: async () => {
        await embeddedGateway.syncAuthProfiles();
      },
    }),
    config,
    embeddedGateway,
    gatewaySupervisor,
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
    async close() {
      server.close();
      await gatewaySupervisor.stop();
    },
  };
}

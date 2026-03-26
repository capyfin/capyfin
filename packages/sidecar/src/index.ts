import { serve } from "@hono/node-server";
import packageJson from "../package.json" with { type: "json" };
import { AutomationService } from "./automation/service.ts";
import { RuntimeProviderAuthService } from "./auth/service.ts";
import { RuntimeAuthSessionManager } from "./auth/sessions.ts";
import { loadSidecarConfig, type SidecarConfig } from "./config.ts";
import { DataProviderService } from "./data-providers/service.ts";
import { DeliveryChannelService } from "./delivery-channels/service.ts";
import { LibraryService } from "./library/service.ts";
import { PortfolioService } from "./portfolio/service.ts";
import { PreferencesService } from "./preferences/service.ts";
import { WatchlistService } from "./watchlist/service.ts";
import { syncWatchlistToWorkspace } from "./watchlist/workspace-sync.ts";
import { EmbeddedGatewayClient } from "./internal-gateway/gateway-client.ts";
import { AgentMetadataStoreService } from "./internal-gateway/metadata-store.ts";
import { EmbeddedGatewaySupervisor } from "./internal-gateway/supervisor.ts";
import { migrateLegacyDefaultWorkspacePersona } from "./internal-gateway/workspace-bootstrap.ts";
import { createSidecarApp } from "./server/app.ts";

export interface SidecarServerHandle {
  close(): Promise<void>;
}

export { RuntimeProviderAuthService } from "./auth/service.ts";
export { RuntimeAuthSessionManager } from "./auth/sessions.ts";
export {
  ensureEmbeddedGatewayDirectories,
  resolveEmbeddedGatewayPaths,
  type EmbeddedGatewayPaths,
} from "./internal-gateway/paths.ts";
export { EmbeddedGatewaySupervisor } from "./internal-gateway/supervisor.ts";
export { AgentMetadataStoreService } from "./internal-gateway/metadata-store.ts";
export { EmbeddedGatewayClient } from "./internal-gateway/gateway-client.ts";

export async function startSidecarServer(
  config: SidecarConfig = loadSidecarConfig(),
): Promise<SidecarServerHandle> {
  const gatewaySupervisor = new EmbeddedGatewaySupervisor(process.env);
  await gatewaySupervisor.launch();
  void gatewaySupervisor.waitUntilReady().catch((error: unknown) => {
    console.error("[sidecar] embedded gateway failed to become ready", error);
  });
  process.env.OPENCLAW_CONFIG_PATH = gatewaySupervisor.paths.configPath;
  process.env.OPENCLAW_OAUTH_DIR = gatewaySupervisor.paths.oauthDir;
  process.env.OPENCLAW_STATE_DIR = gatewaySupervisor.paths.stateDir;
  const metadataStore = new AgentMetadataStoreService(gatewaySupervisor.paths);
  const defaultAgent = await metadataStore.ensureDefaultAgent();
  await migrateLegacyDefaultWorkspacePersona(defaultAgent.workspaceDir);
  const authService = new RuntimeProviderAuthService(
    gatewaySupervisor.paths,
    process.env,
  );
  const embeddedGateway = new EmbeddedGatewayClient({
    authService,
    metadataStore,
    paths: gatewaySupervisor.paths,
    target: gatewaySupervisor.connection,
  });
  const automationService = new AutomationService(
    gatewaySupervisor.paths.stateDir,
  );
  const dataProviderService = new DataProviderService(
    gatewaySupervisor.paths.stateDir,
  );
  const deliveryChannelService = new DeliveryChannelService(
    gatewaySupervisor.paths.stateDir,
  );
  const libraryService = new LibraryService(gatewaySupervisor.paths.stateDir);
  const portfolioService = new PortfolioService(
    gatewaySupervisor.paths.stateDir,
    defaultAgent.workspaceDir,
  );
  const preferencesService = new PreferencesService(
    gatewaySupervisor.paths.stateDir,
  );
  const watchlistService = new WatchlistService(
    gatewaySupervisor.paths.stateDir,
    defaultAgent.workspaceDir,
  );
  // Sync watchlist to agent workspace on boot so the agent has fresh data
  const watchlistItems = await watchlistService.getAll();
  if (watchlistItems.length > 0) {
    await syncWatchlistToWorkspace(defaultAgent.workspaceDir, watchlistItems);
  }

  const runtime = {
    automationService,
    authService,
    authSessions: new RuntimeAuthSessionManager(() => authService),
    config,
    dataProviderService,
    deliveryChannelService,
    libraryService,
    portfolioService,
    preferencesService,
    watchlistService,
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

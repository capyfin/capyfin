import type { SidecarConfig } from "../config.ts";
import type { RuntimeProviderAuthService } from "../auth/service.ts";
import type { RuntimeAuthSessionManager } from "../auth/sessions.ts";
import type { DataProviderService } from "../data-providers/service.ts";
import type { LibraryService } from "../library/service.ts";
import type { PortfolioService } from "../portfolio/service.ts";
import type { PreferencesService } from "../preferences/service.ts";
import type { EmbeddedGatewayClient } from "../internal-gateway/gateway-client.ts";
import type { EmbeddedGatewaySupervisor } from "../internal-gateway/supervisor.ts";

export interface SidecarRuntime {
  authSessions: RuntimeAuthSessionManager;
  authService: RuntimeProviderAuthService;
  config: SidecarConfig;
  dataProviderService: DataProviderService;
  libraryService: LibraryService;
  portfolioService: PortfolioService;
  preferencesService: PreferencesService;
  embeddedGateway: EmbeddedGatewayClient;
  gatewaySupervisor: EmbeddedGatewaySupervisor;
  startedAt: number;
  version: string;
}

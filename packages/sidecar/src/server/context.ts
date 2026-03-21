import type { SidecarConfig } from "../config.ts";
import type { RuntimeProviderAuthService } from "../auth/service.ts";
import type { RuntimeAuthSessionManager } from "../auth/sessions.ts";
import type { DataProviderService } from "../data-providers/service.ts";
import type { EmbeddedGatewayClient } from "../internal-gateway/gateway-client.ts";
import type { EmbeddedGatewaySupervisor } from "../internal-gateway/supervisor.ts";

export interface SidecarRuntime {
  authSessions: RuntimeAuthSessionManager;
  authService: RuntimeProviderAuthService;
  config: SidecarConfig;
  dataProviderService: DataProviderService;
  embeddedGateway: EmbeddedGatewayClient;
  gatewaySupervisor: EmbeddedGatewaySupervisor;
  startedAt: number;
  version: string;
}

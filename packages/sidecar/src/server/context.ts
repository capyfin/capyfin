import type { ProviderAuthService } from "@capyfin/core/auth";
import type { SidecarConfig } from "../config.ts";
import type { OAuthSessionManager } from "../auth/oauth-sessions.ts";
import type { EmbeddedGatewayClient } from "../internal-gateway/gateway-client.ts";
import type { EmbeddedGatewaySupervisor } from "../internal-gateway/supervisor.ts";

export interface SidecarRuntime {
  authSessions: OAuthSessionManager;
  authService: ProviderAuthService;
  config: SidecarConfig;
  embeddedGateway: EmbeddedGatewayClient;
  gatewaySupervisor: EmbeddedGatewaySupervisor;
  startedAt: number;
  version: string;
}

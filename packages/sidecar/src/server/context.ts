import type { AgentService } from "@capyfin/core/agents";
import type { ProviderAuthService } from "@capyfin/core/auth";
import type { SidecarConfig } from "../config.ts";
import type { OAuthSessionManager } from "../auth/oauth-sessions.ts";

export interface SidecarRuntime {
  authSessions: OAuthSessionManager;
  config: SidecarConfig;
  createAgentService(): AgentService;
  createAuthService(): ProviderAuthService;
  startedAt: number;
  version: string;
}

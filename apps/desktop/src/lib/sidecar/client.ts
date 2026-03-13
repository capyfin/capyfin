import {
  agentCatalogSchema,
  agentSchema,
  authOverviewSchema,
  chatBootstrapSchema,
  connectProviderSecretRequestSchema,
  createAgentRequestSchema,
  createBasicAuthHeader,
  oauthSessionSchema,
  selectProviderRequestSchema,
  sidecarBootstrapSchema,
  sidecarConnectionSchema,
  sidecarHealthSchema,
  startOAuthSessionRequestSchema,
  submitOAuthSessionPromptRequestSchema,
  type AuthOverview,
  type Agent,
  type AgentCatalog,
  type ChatBootstrap,
  type OAuthSession,
  type ProviderStatus,
  type SidecarBootstrap,
  type SidecarConnection,
  type SidecarHealth,
  providerStatusSchema,
  storedProfileSummarySchema,
} from "@capyfin/contracts";

export class SidecarClient {
  constructor(private readonly connection: SidecarConnection) {}

  static fromConnection(candidate: unknown): SidecarClient {
    return new SidecarClient(sidecarConnectionSchema.parse(candidate));
  }

  async waitUntilHealthy(timeoutMs = 20_000): Promise<SidecarHealth> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        return await this.health();
      } catch {
        await new Promise((resolve) => window.setTimeout(resolve, 150));
      }
    }

    throw new Error("Timed out waiting for the sidecar to become healthy.");
  }

  async health(): Promise<SidecarHealth> {
    return sidecarHealthSchema.parse(await this.request("/global/health"));
  }

  async bootstrap(): Promise<SidecarBootstrap> {
    return sidecarBootstrapSchema.parse(
      await this.request("/global/bootstrap"),
    );
  }

  async authOverview(): Promise<AuthOverview> {
    return authOverviewSchema.parse(await this.request("/auth/overview"));
  }

  async chatBootstrap(agentId?: string): Promise<ChatBootstrap> {
    const query = agentId ? `?agentId=${encodeURIComponent(agentId)}` : "";
    return chatBootstrapSchema.parse(await this.request(`/chat/bootstrap${query}`));
  }

  async agents(): Promise<AgentCatalog> {
    return agentCatalogSchema.parse(await this.request("/agents"));
  }

  async createAgent(payload: {
    id?: string;
    name: string;
    description?: string;
    instructions?: string;
    providerId?: string;
    modelId?: string;
    workspaceDir?: string;
    setAsDefault?: boolean;
  }): Promise<Agent> {
    return agentSchema.parse(
      await this.request("/agents", {
        body: JSON.stringify(createAgentRequestSchema.parse(payload)),
        method: "POST",
      }),
    );
  }

  async connectProviderSecret(payload: {
    label?: string;
    providerId: string;
    secret: string;
  }): Promise<void> {
    connectProviderSecretRequestSchema.parse(payload);
    storedProfileSummarySchema.parse(
      await this.request("/auth/credentials", {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    );
  }

  async selectProvider(selector: string): Promise<ProviderStatus> {
    return providerStatusSchema.parse(
      await this.request("/auth/select", {
        body: JSON.stringify(selectProviderRequestSchema.parse({ selector })),
        method: "POST",
      }),
    );
  }

  async deleteAuthProfile(profileId: string): Promise<void> {
    await this.request(`/auth/profiles/${encodeURIComponent(profileId)}`, {
      method: "DELETE",
    });
  }

  async startOAuthSession(payload: {
    label?: string;
    providerId: string;
  }): Promise<OAuthSession> {
    return oauthSessionSchema.parse(
      await this.request("/auth/oauth/start", {
        body: JSON.stringify(startOAuthSessionRequestSchema.parse(payload)),
        method: "POST",
      }),
    );
  }

  async getOAuthSession(sessionId: string): Promise<OAuthSession> {
    return oauthSessionSchema.parse(
      await this.request(`/auth/oauth/sessions/${sessionId}`),
    );
  }

  async submitOAuthSessionPrompt(
    sessionId: string,
    value: string,
  ): Promise<OAuthSession> {
    return oauthSessionSchema.parse(
      await this.request(`/auth/oauth/sessions/${sessionId}/respond`, {
        body: JSON.stringify(
          submitOAuthSessionPromptRequestSchema.parse({ value }),
        ),
        method: "POST",
      }),
    );
  }

  createApiUrl(path: string): string {
    return new URL(path, this.connection.url).toString();
  }

  createAuthHeaders(): Headers {
    const headers = new Headers();
    headers.set(
      "Authorization",
      createBasicAuthHeader(this.connection.username, this.connection.password),
    );
    return headers;
  }

  private async request(
    path: string,
    init?: RequestInit,
  ): Promise<unknown> {
    const headers = this.createAuthHeaders();
    const initHeaders = new Headers(init?.headers);
    for (const [key, value] of initHeaders.entries()) {
      headers.set(key, value);
    }

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(new URL(path, this.connection.url), {
      ...init,
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Sidecar request failed with status ${String(response.status)}.`,
      );
    }

    if (response.status === 204) {
      return null;
    }

    return (await response.json()) as unknown;
  }
}

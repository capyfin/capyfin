import {
  agentCatalogSchema,
  agentSchema,
  agentSessionListSchema,
  agentSessionSchema,
  authSessionSchema,
  authOverviewSchema,
  chatBootstrapSchema,
  connectProviderSecretRequestSchema,
  createAgentRequestSchema,
  createAgentSessionRequestSchema,
  dataProviderOverviewSchema,
  dataProviderStatusSchema,
  installSkillRequestSchema,
  installSkillResponseSchema,
  portfolioDeleteResponseSchema,
  portfolioStatusResponseSchema,
  portfolioUploadResponseSchema,
  removeSkillResponseSchema,
  saveDataProviderKeyRequestSchema,
  updateAgentRequestSchema,
  updateAgentSessionRequestSchema,
  providerModelCatalogSchema,
  createBasicAuthHeader,
  respondAuthSessionRequestSchema,
  savedConnectionSchema,
  setProviderModelRequestSchema,
  selectConnectionRequestSchema,
  skillCatalogSchema,
  sidecarBootstrapSchema,
  sidecarConnectionSchema,
  sidecarHealthSchema,
  startAuthSessionRequestSchema,
  type AgentSession,
  type AgentSessionList,
  type AuthOverview,
  type Agent,
  type AgentCatalog,
  type AuthSession,
  type ChatBootstrap,
  type DataProviderOverview,
  type DataProviderStatus,
  type InstallSkillResponse,
  type PortfolioDeleteResponse,
  type PortfolioStatusResponse,
  type PortfolioUploadResponse,
  type ProviderModelCatalog,
  type RemoveSkillResponse,
  type SavedConnection,
  type SidecarBootstrap,
  type SidecarConnection,
  type SidecarHealth,
  type SkillCatalog,
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

  async chatBootstrap(
    agentId?: string,
    sessionId?: string,
  ): Promise<ChatBootstrap> {
    const params = new URLSearchParams();
    if (agentId) {
      params.set("agentId", agentId);
    }
    if (sessionId) {
      params.set("sessionId", sessionId);
    }
    const query = params.toString();
    return chatBootstrapSchema.parse(
      await this.request(`/chat/bootstrap${query ? `?${query}` : ""}`),
    );
  }

  async listSessions(agentId?: string): Promise<AgentSessionList> {
    const query = agentId ? `?agentId=${encodeURIComponent(agentId)}` : "";
    return agentSessionListSchema.parse(
      await this.request(`/agents/sessions${query}`),
    );
  }

  async createSession(payload: {
    agentId: string;
    label?: string;
  }): Promise<AgentSession> {
    return agentSessionSchema.parse(
      await this.request("/agents/sessions", {
        body: JSON.stringify(createAgentSessionRequestSchema.parse(payload)),
        method: "POST",
      }),
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.request(`/agents/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    });
  }

  async updateSessionLabel(
    sessionId: string,
    label: string,
  ): Promise<AgentSession> {
    return agentSessionSchema.parse(
      await this.request(`/agents/sessions/${encodeURIComponent(sessionId)}`, {
        body: JSON.stringify(updateAgentSessionRequestSchema.parse({ label })),
        method: "PATCH",
      }),
    );
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

  async updateAgent(
    agentId: string,
    payload: {
      name?: string;
      description?: string;
      instructions?: string;
      providerId?: string;
      modelId?: string;
      workspaceDir?: string;
      setAsDefault?: boolean;
    },
  ): Promise<Agent> {
    return agentSchema.parse(
      await this.request(`/agents/${encodeURIComponent(agentId)}`, {
        body: JSON.stringify(updateAgentRequestSchema.parse(payload)),
        method: "PATCH",
      }),
    );
  }

  async connectProviderSecret(payload: {
    authChoice: string;
    secret: string;
  }): Promise<SavedConnection> {
    return savedConnectionSchema.parse(
      await this.request("/auth/credentials", {
        body: JSON.stringify(connectProviderSecretRequestSchema.parse(payload)),
        method: "POST",
      }),
    );
  }

  async selectConnection(profileId: string): Promise<SavedConnection> {
    return savedConnectionSchema.parse(
      await this.request("/auth/select", {
        body: JSON.stringify(
          selectConnectionRequestSchema.parse({ profileId }),
        ),
        method: "POST",
      }),
    );
  }

  async providerModels(providerId: string): Promise<ProviderModelCatalog> {
    return providerModelCatalogSchema.parse(
      await this.request(
        `/auth/providers/${encodeURIComponent(providerId)}/models`,
      ),
    );
  }

  async setProviderModel(
    providerId: string,
    modelRef: string,
  ): Promise<AuthOverview> {
    return authOverviewSchema.parse(
      await this.request(
        `/auth/providers/${encodeURIComponent(providerId)}/model`,
        {
          body: JSON.stringify(
            setProviderModelRequestSchema.parse({ modelRef }),
          ),
          method: "POST",
        },
      ),
    );
  }

  async deleteAuthProfile(profileId: string): Promise<void> {
    await this.request(`/auth/profiles/${encodeURIComponent(profileId)}`, {
      method: "DELETE",
    });
  }

  async startAuthSession(payload: {
    authChoice: string;
  }): Promise<AuthSession> {
    return authSessionSchema.parse(
      await this.request("/auth/sessions", {
        body: JSON.stringify(startAuthSessionRequestSchema.parse(payload)),
        method: "POST",
      }),
    );
  }

  async getAuthSession(sessionId: string): Promise<AuthSession> {
    return authSessionSchema.parse(
      await this.request(`/auth/sessions/${sessionId}`),
    );
  }

  async respondToAuthSession(
    sessionId: string,
    value: boolean | string | string[],
  ): Promise<AuthSession> {
    return authSessionSchema.parse(
      await this.request(`/auth/sessions/${sessionId}/respond`, {
        body: JSON.stringify(respondAuthSessionRequestSchema.parse({ value })),
        method: "POST",
      }),
    );
  }

  async uploadPortfolio(
    agentId: string,
    csv: string,
  ): Promise<PortfolioUploadResponse> {
    return portfolioUploadResponseSchema.parse(
      await this.request(`/agents/${encodeURIComponent(agentId)}/portfolio`, {
        body: JSON.stringify({ csv }),
        method: "POST",
      }),
    );
  }

  async getPortfolioStatus(agentId: string): Promise<PortfolioStatusResponse> {
    return portfolioStatusResponseSchema.parse(
      await this.request(`/agents/${encodeURIComponent(agentId)}/portfolio`),
    );
  }

  async deletePortfolio(agentId: string): Promise<PortfolioDeleteResponse> {
    return portfolioDeleteResponseSchema.parse(
      await this.request(`/agents/${encodeURIComponent(agentId)}/portfolio`, {
        method: "DELETE",
      }),
    );
  }

  async listSkills(): Promise<SkillCatalog> {
    return skillCatalogSchema.parse(await this.request("/skills"));
  }

  async installSkill(skillId: string): Promise<InstallSkillResponse> {
    return installSkillResponseSchema.parse(
      await this.request("/skills/install", {
        body: JSON.stringify(installSkillRequestSchema.parse({ skillId })),
        method: "POST",
      }),
    );
  }

  async removeSkill(skillId: string): Promise<RemoveSkillResponse> {
    return removeSkillResponseSchema.parse(
      await this.request(`/skills/${encodeURIComponent(skillId)}`, {
        method: "DELETE",
      }),
    );
  }

  async getDataProviders(): Promise<DataProviderOverview> {
    return dataProviderOverviewSchema.parse(
      await this.request("/providers/data"),
    );
  }

  async saveDataProviderKey(
    providerId: string,
    apiKey: string,
  ): Promise<DataProviderStatus> {
    return dataProviderStatusSchema.parse(
      await this.request(`/providers/data/${encodeURIComponent(providerId)}`, {
        body: JSON.stringify(
          saveDataProviderKeyRequestSchema.parse({ apiKey }),
        ),
        method: "PUT",
      }),
    );
  }

  async deleteDataProviderKey(providerId: string): Promise<void> {
    await this.request(`/providers/data/${encodeURIComponent(providerId)}`, {
      method: "DELETE",
    });
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

  private async request(path: string, init?: RequestInit): Promise<unknown> {
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

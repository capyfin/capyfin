import {
  authOverviewSchema,
  connectProviderSecretRequestSchema,
  createBasicAuthHeader,
  oauthSessionSchema,
  selectProviderRequestSchema,
  sidecarBootstrapSchema,
  sidecarConnectionSchema,
  sidecarHealthSchema,
  startOAuthSessionRequestSchema,
  submitOAuthSessionPromptRequestSchema,
  type AuthOverview,
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

  private async request(
    path: string,
    init?: RequestInit,
  ): Promise<unknown> {
    const headers = new Headers(init?.headers);
    headers.set(
      "Authorization",
      createBasicAuthHeader(this.connection.username, this.connection.password),
    );
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

    return (await response.json()) as unknown;
  }
}

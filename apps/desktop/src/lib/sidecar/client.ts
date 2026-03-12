import {
  createBasicAuthHeader,
  sidecarBootstrapSchema,
  sidecarConnectionSchema,
  sidecarHealthSchema,
  type SidecarBootstrap,
  type SidecarConnection,
  type SidecarHealth,
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

  private async request(path: string): Promise<unknown> {
    const response = await fetch(new URL(path, this.connection.url), {
      headers: {
        Authorization: createBasicAuthHeader(
          this.connection.username,
          this.connection.password,
        ),
      },
    });

    if (!response.ok) {
      throw new Error(
        `Sidecar request failed with status ${String(response.status)}.`,
      );
    }

    return (await response.json()) as unknown;
  }
}

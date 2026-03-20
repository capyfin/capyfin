import type { ResolvedRunCliOptions } from "../app.ts";

export async function runServe(
  values: Record<string, string | boolean | undefined>,
  options: ResolvedRunCliOptions,
): Promise<void> {
  const { startSidecarServer } = await import("@capyfin/sidecar");
  const portValue = readStringValue(values.port);
  const port = portValue ? Number.parseInt(portValue, 10) : undefined;
  const password =
    readStringValue(values.password) ?? options.env.CAPYFIN_SERVER_PASSWORD;

  if (!password) {
    throw new Error(
      "Missing sidecar password. Provide --password or CAPYFIN_SERVER_PASSWORD.",
    );
  }

  if (
    port === undefined ||
    !Number.isInteger(port) ||
    port <= 0 ||
    port > 65_535
  ) {
    throw new Error("Missing or invalid sidecar port. Provide --port.");
  }

  const server = await startSidecarServer({
    hostname: readStringValue(values.hostname) ?? "127.0.0.1",
    password,
    port,
    username: readStringValue(values.username) ?? "capyfin",
  });

  const shutdown = () => {
    void server.close();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function readStringValue(
  value: string | boolean | undefined,
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

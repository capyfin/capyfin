import { dirname } from "node:path";
import {
  AgentMetadataStoreService,
  EmbeddedGatewayClient,
  EmbeddedGatewaySupervisor,
  RuntimeProviderAuthService,
  ensureEmbeddedGatewayDirectories,
  resolveEmbeddedGatewayPaths,
  type EmbeddedGatewayPaths,
} from "@capyfin/sidecar";
import type { ResolvedRunCliOptions } from "./app.ts";

interface CliRuntimeAuthContext {
  authService: RuntimeProviderAuthService;
  env: NodeJS.ProcessEnv;
  paths: EmbeddedGatewayPaths;
}

interface CliRuntimeGatewayContext extends CliRuntimeAuthContext {
  embeddedGateway: EmbeddedGatewayClient;
  metadataStore: AgentMetadataStoreService;
}

export function resolveCliEnv(
  options: ResolvedRunCliOptions,
): NodeJS.ProcessEnv {
  const env = { ...options.env };
  if (options.storePath && !env.CAPYFIN_CONFIG_HOME?.trim()) {
    env.CAPYFIN_CONFIG_HOME = dirname(options.storePath);
  }
  return env;
}

export async function createCliAuthContext(
  options: ResolvedRunCliOptions,
): Promise<CliRuntimeAuthContext> {
  const env = resolveCliEnv(options);
  const paths = resolveEmbeddedGatewayPaths(env);
  await ensureEmbeddedGatewayDirectories(paths);

  return {
    authService: new RuntimeProviderAuthService(paths, env),
    env,
    paths,
  };
}

export async function withEmbeddedGatewayContext<T>(
  options: ResolvedRunCliOptions,
  run: (context: CliRuntimeGatewayContext) => Promise<T>,
): Promise<T> {
  const env = resolveCliEnv(options);
  const gatewaySupervisor = new EmbeddedGatewaySupervisor(env);
  await gatewaySupervisor.start();

  try {
    const metadataStore = new AgentMetadataStoreService(
      gatewaySupervisor.paths,
    );
    await metadataStore.ensureDefaultAgent();
    const authService = new RuntimeProviderAuthService(
      gatewaySupervisor.paths,
      env,
    );
    const embeddedGateway = new EmbeddedGatewayClient({
      authService,
      metadataStore,
      paths: gatewaySupervisor.paths,
      target: gatewaySupervisor.connection,
    });

    return await run({
      authService,
      embeddedGateway,
      env,
      metadataStore,
      paths: gatewaySupervisor.paths,
    });
  } finally {
    await gatewaySupervisor.stop();
  }
}

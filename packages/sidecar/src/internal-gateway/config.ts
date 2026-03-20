import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { EmbeddedGatewayPaths } from "./paths.ts";
import { resolveGatewayAgentDir } from "./paths.ts";

interface GatewayDiscoveryConfig {
  mdns?: { mode?: string; [key: string]: unknown };
  wideArea?: { enabled?: boolean; [key: string]: unknown };
  [key: string]: unknown;
}

interface GatewayAuthConfig {
  mode?: string;
  token?: string;
  [key: string]: unknown;
}

interface GatewayControlUiConfig {
  enabled?: boolean;
  [key: string]: unknown;
}

interface GatewayServerConfig {
  auth?: GatewayAuthConfig;
  bind?: string;
  controlUi?: GatewayControlUiConfig;
  port?: number;
  [key: string]: unknown;
}

interface GatewayLoggingConfig {
  file?: string;
  level?: string;
  [key: string]: unknown;
}

interface GatewayAgentEntry {
  agentDir?: string;
  default?: boolean;
  id?: string;
  name?: string;
  workspace?: string;
  [key: string]: unknown;
}

interface GatewayAgentsConfig {
  list?: GatewayAgentEntry[];
  [key: string]: unknown;
}

interface GatewayConfig {
  agents?: GatewayAgentsConfig;
  discovery?: GatewayDiscoveryConfig;
  gateway?: GatewayServerConfig;
  logging?: GatewayLoggingConfig;
  [key: string]: unknown;
}

function safeSection<T>(value: unknown): T {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : ({} as T);
}

function createEmptyConfig(): GatewayConfig {
  return {};
}

async function loadExistingConfig(
  configPath: string,
): Promise<GatewayConfig> {
  try {
    const source = await readFile(configPath, "utf8");
    const parsed = JSON.parse(source) as unknown;
    return safeSection<GatewayConfig>(parsed);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return createEmptyConfig();
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid embedded runtime config JSON at ${configPath}.`);
    }
    throw error;
  }
}

function upsertMainAgentEntry(params: {
  existingConfig: GatewayConfig;
  paths: EmbeddedGatewayPaths;
}): GatewayConfig {
  const agents = safeSection<GatewayAgentsConfig>(
    params.existingConfig.agents,
  );
  const rawList = Array.isArray(agents.list) ? agents.list : [];
  const mainWorkspace = join(params.paths.workspacesDir, "main");
  const mainAgentDir = resolveGatewayAgentDir(params.paths, "main");

  const nextList = [...rawList];
  const mainIndex = nextList.findIndex(
    (entry) =>
      typeof entry.id === "string" && entry.id.trim().toLowerCase() === "main",
  );
  const mainEntry: GatewayAgentEntry = {
    ...(mainIndex >= 0 ? nextList[mainIndex] : {}),
    agentDir: mainAgentDir,
    default: true,
    id: "main",
    name: "Main",
    workspace: mainWorkspace,
  };

  if (mainIndex >= 0) {
    nextList[mainIndex] = mainEntry;
  } else {
    nextList.unshift(mainEntry);
  }

  return {
    ...params.existingConfig,
    agents: {
      ...agents,
      list: nextList,
    },
  };
}

export async function writeEmbeddedGatewayConfig(params: {
  paths: EmbeddedGatewayPaths;
  port: number;
  token: string;
}): Promise<void> {
  const existingConfig = await loadExistingConfig(params.paths.configPath);
  const payload = upsertMainAgentEntry({
    existingConfig,
    paths: params.paths,
  });

  const discovery = safeSection<GatewayDiscoveryConfig>(payload.discovery);
  const gateway = safeSection<GatewayServerConfig>(payload.gateway);
  const logging = safeSection<GatewayLoggingConfig>(payload.logging);

  await writeFile(
    params.paths.configPath,
    `${JSON.stringify(
      {
        ...payload,
        discovery: {
          ...discovery,
          mdns: {
            ...safeSection<GatewayDiscoveryConfig["mdns"]>(discovery.mdns),
            mode: "off",
          },
          wideArea: {
            ...safeSection<GatewayDiscoveryConfig["wideArea"]>(
              discovery.wideArea,
            ),
            enabled: false,
          },
        },
        gateway: {
          ...gateway,
          auth: {
            ...safeSection<GatewayAuthConfig>(gateway.auth),
            mode: "token",
            token: params.token,
          },
          bind: "loopback",
          controlUi: {
            ...safeSection<GatewayControlUiConfig>(gateway.controlUi),
            enabled: false,
          },
          port: params.port,
        },
        logging: {
          ...logging,
          file: join(params.paths.logsDir, "gateway.log"),
          level: "info",
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

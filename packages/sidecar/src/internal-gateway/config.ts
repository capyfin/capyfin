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

function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function createEmptyConfig(): GatewayConfig {
  return {};
}

async function loadExistingConfig(
  configPath: string,
): Promise<GatewayConfig> {
  try {
    const source = await readFile(configPath, "utf8");
    const parsed: unknown = JSON.parse(source);
    return isObject(parsed) ? (parsed as GatewayConfig) : createEmptyConfig();
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
  const agents: GatewayAgentsConfig = isObject(params.existingConfig.agents)
    ? params.existingConfig.agents
    : {};
  const rawList: GatewayAgentEntry[] = Array.isArray(agents.list)
    ? agents.list
    : [];
  const mainWorkspace = join(params.paths.workspacesDir, "main");
  const mainAgentDir = resolveGatewayAgentDir(params.paths, "main");

  const nextList: GatewayAgentEntry[] = [...rawList];
  const mainIndex = nextList.findIndex(
    (entry) =>
      typeof entry.id === "string" && entry.id.trim().toLowerCase() === "main",
  );
  const existing: GatewayAgentEntry =
    mainIndex >= 0 ? (nextList[mainIndex] ?? {}) : {};
  const mainEntry: GatewayAgentEntry = {
    ...existing,
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

  const discovery: GatewayDiscoveryConfig = isObject(payload.discovery)
    ? payload.discovery
    : {};
  const gateway: GatewayServerConfig = isObject(payload.gateway)
    ? payload.gateway
    : {};
  const logging: GatewayLoggingConfig = isObject(payload.logging)
    ? payload.logging
    : {};

  await writeFile(
    params.paths.configPath,
    `${JSON.stringify(
      {
        ...payload,
        discovery: {
          ...discovery,
          mdns: {
            ...(isObject(discovery.mdns) ? discovery.mdns : {}),
            mode: "off",
          },
          wideArea: {
            ...(isObject(discovery.wideArea) ? discovery.wideArea : {}),
            enabled: false,
          },
        },
        gateway: {
          ...gateway,
          auth: {
            ...(isObject(gateway.auth) ? gateway.auth : {}),
            mode: "token",
            token: params.token,
          },
          bind: "loopback",
          controlUi: {
            ...(isObject(gateway.controlUi) ? gateway.controlUi : {}),
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

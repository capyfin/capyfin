import { dirname, join } from "node:path";
import { resolveCapyfinConfigDir } from "../config-paths.ts";
import type { AgentFilesystemLayout, AgentStoreLocation } from "./types.ts";
import { normalizeAgentId } from "./types.ts";

const DEFAULT_CATALOG_FILE = "catalog.json";

export function resolveAgentStoreLocation(
  env: NodeJS.ProcessEnv = process.env,
  explicitStorePath?: string,
): AgentStoreLocation {
  const resolvedExplicitStorePath =
    normalizeOptionalString(explicitStorePath) ??
    normalizeOptionalString(env.CAPYFIN_AGENT_STORE_PATH);
  if (resolvedExplicitStorePath) {
    const storeDir = dirname(resolvedExplicitStorePath);
    return {
      agentsRootDir: join(storeDir, "agents"),
      catalogPath: resolvedExplicitStorePath,
      configDir: storeDir,
    };
  }

  const configDir = resolveCapyfinConfigDir(env);
  const agentsRootDir = join(configDir, "agents");
  return {
    agentsRootDir,
    catalogPath: join(agentsRootDir, DEFAULT_CATALOG_FILE),
    configDir,
  };
}

export function resolveAgentFilesystemLayout(
  location: AgentStoreLocation,
  agentId: string,
  workspaceDir?: string,
): AgentFilesystemLayout {
  const normalizedAgentId = normalizeAgentId(agentId);
  const agentDir = join(location.agentsRootDir, normalizedAgentId);
  const sessionsDir = join(agentDir, "sessions");
  return {
    agentDir,
    sessionsDir,
    sessionsIndexPath: join(sessionsDir, "index.json"),
    transcriptsDir: join(sessionsDir, "transcripts"),
    workspaceDir:
      normalizeOptionalString(workspaceDir) ?? join(agentDir, "workspace"),
  };
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  return value?.trim() ? value.trim() : undefined;
}

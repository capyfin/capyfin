import {
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AgentSessionStore, AgentStore } from "./types.ts";
import {
  createEmptyAgentSessionStore,
  createEmptyAgentStore,
  DEFAULT_AGENT_ID,
  normalizeAgentId,
} from "./types.ts";

export async function loadAgentStore(storePath: string): Promise<AgentStore> {
  try {
    const rawContent = await readFile(storePath, "utf8");
    return normalizeAgentStore(JSON.parse(rawContent) as unknown);
  } catch (error) {
    if (isMissingFileError(error)) {
      return createEmptyAgentStore();
    }

    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse agent catalog at ${storePath}. The file contains invalid JSON.`,
      );
    }

    throw error;
  }
}

export async function saveAgentStore(
  store: AgentStore,
  storePath: string,
): Promise<void> {
  await saveJsonFile(normalizeAgentStore(store), storePath);
}

export async function loadAgentSessionStore(
  storePath: string,
): Promise<AgentSessionStore> {
  try {
    const rawContent = await readFile(storePath, "utf8");
    return normalizeAgentSessionStore(JSON.parse(rawContent) as unknown);
  } catch (error) {
    if (isMissingFileError(error)) {
      return createEmptyAgentSessionStore();
    }

    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse agent session store at ${storePath}. The file contains invalid JSON.`,
      );
    }

    throw error;
  }
}

export async function saveAgentSessionStore(
  store: AgentSessionStore,
  storePath: string,
): Promise<void> {
  await saveJsonFile(normalizeAgentSessionStore(store), storePath);
}

function normalizeAgentStore(raw: unknown): AgentStore {
  if (!raw || typeof raw !== "object") {
    return createEmptyAgentStore();
  }

  const record = raw as Record<string, unknown>;
  const agents = normalizeAgents(record.agents);
  const order = normalizeOrder(record.order, agents);
  const defaultAgentId = normalizeDefaultAgentId(record.defaultAgentId, order);

  return {
    version: 1,
    agents,
    order,
    ...(defaultAgentId ? { defaultAgentId } : {}),
  };
}

function normalizeAgents(raw: unknown): AgentStore["agents"] {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const agents: AgentStore["agents"] = {};

  for (const [agentId, value] of Object.entries(raw as Record<string, unknown>)) {
    const normalizedId = normalizeAgentId(agentId);
    const agent = normalizeAgentRecord(normalizedId, value);
    if (agent) {
      agents[normalizedId] = agent;
    }
  }

  return agents;
}

function normalizeAgentRecord(
  agentId: string,
  raw: unknown,
): AgentStore["agents"][string] | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const name = normalizeOptionalString(record.name);
  const instructions = normalizeOptionalString(record.instructions);
  const workspaceDir = normalizeOptionalString(record.workspaceDir);
  const createdAt =
    normalizeOptionalString(record.createdAt) ?? new Date(0).toISOString();
  const updatedAt = normalizeOptionalString(record.updatedAt) ?? createdAt;

  if (!name || !instructions || !workspaceDir) {
    return null;
  }

  return {
    id: agentId,
    name,
    instructions,
    workspaceDir,
    createdAt,
    updatedAt,
    ...(normalizeOptionalString(record.description)
      ? { description: normalizeOptionalString(record.description) }
      : {}),
    ...(normalizeOptionalString(record.providerId)
      ? { providerId: normalizeOptionalString(record.providerId) }
      : {}),
    ...(normalizeOptionalString(record.modelId)
      ? { modelId: normalizeOptionalString(record.modelId) }
      : {}),
  };
}

function normalizeOrder(
  raw: unknown,
  agents: AgentStore["agents"],
): string[] {
  const order = Array.isArray(raw)
    ? raw
        .filter((value): value is string => typeof value === "string")
        .map((value) => normalizeAgentId(value))
        .filter((value, index, values) => values.indexOf(value) === index)
        .filter((value) => Boolean(agents[value]))
    : [];

  for (const agentId of Object.keys(agents)) {
    if (!order.includes(agentId)) {
      order.push(agentId);
    }
  }

  return order;
}

function normalizeDefaultAgentId(
  raw: unknown,
  order: string[],
): string | undefined {
  const explicitDefault = normalizeOptionalString(raw);
  if (explicitDefault) {
    const normalized = normalizeAgentId(explicitDefault);
    if (order.includes(normalized)) {
      return normalized;
    }
  }

  if (order.includes(DEFAULT_AGENT_ID)) {
    return DEFAULT_AGENT_ID;
  }

  return order[0];
}

function normalizeAgentSessionStore(raw: unknown): AgentSessionStore {
  if (!raw || typeof raw !== "object") {
    return createEmptyAgentSessionStore();
  }

  const record = raw as Record<string, unknown>;
  const sessions = normalizeSessions(record.sessions);
  const order = Array.isArray(record.order)
    ? record.order.filter(
        (value): value is string =>
          typeof value === "string" && Boolean(sessions[value]),
      )
    : [];

  for (const sessionId of Object.keys(sessions)) {
    if (!order.includes(sessionId)) {
      order.push(sessionId);
    }
  }

  return {
    version: 1,
    order,
    sessions,
  };
}

function normalizeSessions(
  raw: unknown,
): AgentSessionStore["sessions"] {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const sessions: AgentSessionStore["sessions"] = {};

  for (const [sessionId, value] of Object.entries(raw as Record<string, unknown>)) {
    const session = normalizeSessionRecord(sessionId, value);
    if (session) {
      sessions[sessionId] = session;
    }
  }

  return sessions;
}

function normalizeSessionRecord(
  sessionId: string,
  raw: unknown,
): AgentSessionStore["sessions"][string] | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const storedSessionId =
    normalizeOptionalString(record.id) ?? normalizeOptionalString(sessionId);
  const sessionKey = normalizeOptionalString(record.sessionKey);
  const sessionFile = normalizeOptionalString(record.sessionFile);
  const createdAt =
    normalizeOptionalString(record.createdAt) ?? new Date(0).toISOString();
  const updatedAt = normalizeOptionalString(record.updatedAt) ?? createdAt;

  if (!storedSessionId || !sessionKey || !sessionFile) {
    return null;
  }

  return {
    id: storedSessionId,
    sessionKey,
    sessionFile,
    createdAt,
    updatedAt,
    ...(normalizeOptionalString(record.label)
      ? { label: normalizeOptionalString(record.label) }
      : {}),
  };
}

async function saveJsonFile(
  payload: AgentStore | AgentSessionStore,
  destinationPath: string,
): Promise<void> {
  const directory = dirname(destinationPath);
  const temporaryPath = join(
    directory,
    `.tmp-${String(process.pid)}-${String(Date.now())}-${Math.random().toString(16).slice(2)}.json`,
  );
  const content = JSON.stringify(payload, null, 2);

  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(temporaryPath, `${content}\n`, { mode: 0o600 });
  await chmod(temporaryPath, 0o600);

  try {
    await rename(temporaryPath, destinationPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

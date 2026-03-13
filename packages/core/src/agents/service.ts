import { mkdir, rm, writeFile } from "node:fs/promises";
import { SessionManager } from "@mariozechner/pi-coding-agent";
import type { AssistantMessage, TextContent, UserMessage } from "@mariozechner/pi-ai";
import type {
  AgentTranscriptMessage,
  AppendSessionMessagesParams,
  AgentCatalog,
  AgentDeleteSummary,
  AgentRecord,
  AgentServiceOptions,
  AgentSessionSummary,
  AgentStore,
  CreateAgentParams,
  CreateAgentSessionParams,
  StoredAgentRecord,
  UpdateAgentParams,
} from "./types.ts";
import {
  buildAgentSessionKey,
  createEmptyAgentStore,
  DEFAULT_AGENT_ID,
  normalizeAgentId,
} from "./types.ts";
import {
  loadAgentSessionStore,
  loadAgentStore,
  saveAgentSessionStore,
  saveAgentStore,
} from "./store.ts";
import {
  resolveAgentFilesystemLayout,
  resolveAgentStoreLocation,
} from "./paths.ts";

const DEFAULT_MAIN_AGENT_NAME = "Main";
const DEFAULT_MAIN_AGENT_DESCRIPTION = "Primary CapyFin finance orchestration agent.";
const DEFAULT_MAIN_AGENT_INSTRUCTIONS =
  "You are the primary CapyFin agent. Help users coordinate finance workflows, planning, and analysis across the application.";

export class AgentService {
  readonly #env: NodeJS.ProcessEnv;
  readonly #now: () => Date;
  readonly #storePath: string;

  constructor(options: AgentServiceOptions = {}) {
    this.#env = options.env ?? process.env;
    this.#now = options.now ?? (() => new Date());
    this.#storePath = resolveAgentStoreLocation(
      this.#env,
      options.storePath,
    ).catalogPath;
  }

  getStorePath(): string {
    return this.#storePath;
  }

  async getCatalog(): Promise<AgentCatalog> {
    const store = await this.#readStore();

    return {
      agents: store.order.map((agentId) => {
        const record = store.agents[agentId];
        if (!record) {
          throw new Error(`Agent "${agentId}" is missing from the catalog store.`);
        }

        return this.#toAgentRecord(record, store.defaultAgentId ?? DEFAULT_AGENT_ID);
      }),
      defaultAgentId: store.defaultAgentId ?? DEFAULT_AGENT_ID,
      storePath: this.#storePath,
    };
  }

  async getAgent(agentId: string): Promise<AgentRecord> {
    const store = await this.#readStore();
    const normalizedAgentId = normalizeAgentId(agentId);
    const agent = store.agents[normalizedAgentId];
    if (!agent) {
      throw new Error(`Agent "${normalizedAgentId}" not found.`);
    }

    return this.#toAgentRecord(agent, store.defaultAgentId ?? DEFAULT_AGENT_ID);
  }

  async createAgent(params: CreateAgentParams): Promise<AgentRecord> {
    const store = await this.#readStore();
    const timestamp = this.#timestamp();
    const location = this.#location();
    const name = normalizeRequiredString(params.name, "Agent name is required.");
    const agentId = normalizeAgentId(params.id ?? name);

    if (store.agents[agentId]) {
      throw new Error(`Agent "${agentId}" already exists.`);
    }

    const layout = resolveAgentFilesystemLayout(location, agentId, params.workspaceDir);
    const record: StoredAgentRecord = {
      id: agentId,
      name,
      instructions:
        normalizeOptionalString(params.instructions) ??
        buildDefaultInstructions(name),
      workspaceDir: layout.workspaceDir,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(normalizeOptionalString(params.description)
        ? { description: normalizeOptionalString(params.description) }
        : {}),
      ...(normalizeOptionalString(params.providerId)
        ? { providerId: normalizeOptionalString(params.providerId) }
        : {}),
      ...(normalizeOptionalString(params.modelId)
        ? { modelId: normalizeOptionalString(params.modelId) }
        : {}),
    };

    store.agents[agentId] = record;
    store.order.push(agentId);
    if (params.setAsDefault || !store.defaultAgentId) {
      store.defaultAgentId = agentId;
    }

    await mkdir(layout.workspaceDir, { recursive: true });
    await saveAgentStore(store, this.#storePath);
    return this.#toAgentRecord(record, store.defaultAgentId ?? DEFAULT_AGENT_ID);
  }

  async updateAgent(
    agentId: string,
    params: UpdateAgentParams,
  ): Promise<AgentRecord> {
    const store = await this.#readStore();
    const normalizedAgentId = normalizeAgentId(agentId);
    const existing = store.agents[normalizedAgentId];
    if (!existing) {
      throw new Error(`Agent "${normalizedAgentId}" not found.`);
    }

    const nextWorkspaceDir =
      normalizeOptionalString(params.workspaceDir) ?? existing.workspaceDir;
    const nextName = normalizeOptionalString(params.name) ?? existing.name;
    const nextDescription =
      params.description !== undefined
        ? normalizeOptionalString(params.description)
        : existing.description;
    const nextInstructions =
      normalizeOptionalString(params.instructions) ?? existing.instructions;
    const nextProviderId =
      params.providerId !== undefined
        ? normalizeOptionalString(params.providerId)
        : existing.providerId;
    const nextModelId =
      params.modelId !== undefined
        ? normalizeOptionalString(params.modelId)
        : existing.modelId;

    const nextRecord: StoredAgentRecord = {
      ...existing,
      name: nextName,
      workspaceDir: nextWorkspaceDir,
      instructions: nextInstructions,
      updatedAt: this.#timestamp(),
      ...(nextDescription ? { description: nextDescription } : {}),
      ...(nextProviderId ? { providerId: nextProviderId } : {}),
      ...(nextModelId ? { modelId: nextModelId } : {}),
    };

    if (!nextRecord.instructions.trim()) {
      nextRecord.instructions = buildDefaultInstructions(nextRecord.name);
    }

    if (!nextRecord.name.trim()) {
      throw new Error("Agent name cannot be empty.");
    }

    if (!nextRecord.workspaceDir.trim()) {
      throw new Error("Agent workspace directory cannot be empty.");
    }

    const nextAgents = { ...store.agents };
    nextAgents[normalizedAgentId] = nextRecord;
    store.agents = nextAgents;
    if (params.setAsDefault) {
      store.defaultAgentId = normalizedAgentId;
    }

    await mkdir(nextRecord.workspaceDir, { recursive: true });
    await saveAgentStore(store, this.#storePath);
    return this.#toAgentRecord(nextRecord, store.defaultAgentId ?? DEFAULT_AGENT_ID);
  }

  async deleteAgent(agentId: string): Promise<AgentDeleteSummary> {
    const store = await this.#readStore();
    const normalizedAgentId = normalizeAgentId(agentId);
    const existing = store.agents[normalizedAgentId];
    if (!existing) {
      throw new Error(`Agent "${normalizedAgentId}" not found.`);
    }

    if (normalizedAgentId === DEFAULT_AGENT_ID) {
      throw new Error(`Agent "${DEFAULT_AGENT_ID}" cannot be deleted.`);
    }

    const layout = resolveAgentFilesystemLayout(
      this.#location(),
      normalizedAgentId,
      existing.workspaceDir,
    );
    const sessionStore = await loadAgentSessionStore(layout.sessionsIndexPath);
    const deletedSessions = Object.keys(sessionStore.sessions).length;

    const nextAgents = { ...store.agents };
    Reflect.deleteProperty(nextAgents, normalizedAgentId);
    store.agents = nextAgents;
    store.order = store.order.filter((candidate) => candidate !== normalizedAgentId);
    if (store.defaultAgentId === normalizedAgentId) {
      store.defaultAgentId = store.order[0] ?? DEFAULT_AGENT_ID;
    }

    await saveAgentStore(store, this.#storePath);
    await rm(layout.agentDir, { force: true, recursive: true });

    const removedPaths = [layout.agentDir];
    if (existing.workspaceDir !== layout.workspaceDir) {
      removedPaths.push(existing.workspaceDir);
      await rm(existing.workspaceDir, { force: true, recursive: true });
    }

    return {
      agentId: normalizedAgentId,
      deletedSessions,
      removedPaths,
    };
  }

  async listSessions(agentId?: string): Promise<AgentSessionSummary[]> {
    const store = await this.#readStore();
    const agentIds = agentId
      ? [normalizeAgentId(agentId)]
      : [...store.order];

    const sessions: AgentSessionSummary[] = [];
    for (const candidateId of agentIds) {
      const agent = store.agents[candidateId];
      if (!agent) {
        continue;
      }

      const layout = resolveAgentFilesystemLayout(
        this.#location(),
        candidateId,
        agent.workspaceDir,
      );
      const sessionStore = await loadAgentSessionStore(layout.sessionsIndexPath);
      for (const sessionId of sessionStore.order) {
        const session = sessionStore.sessions[sessionId];
        if (!session) {
          continue;
        }

        sessions.push({
          ...session,
          agentId: candidateId,
          agentName: agent.name,
          workspaceDir: agent.workspaceDir,
        });
      }
    }

    return sessions.sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  async createSession(
    params: CreateAgentSessionParams,
  ): Promise<AgentSessionSummary> {
    const store = await this.#readStore();
    const agentId = normalizeAgentId(params.agentId);
    const agent = store.agents[agentId];
    if (!agent) {
      throw new Error(`Agent "${agentId}" not found.`);
    }

    const layout = resolveAgentFilesystemLayout(
      this.#location(),
      agentId,
      agent.workspaceDir,
    );
    await mkdir(layout.workspaceDir, { recursive: true });
    await mkdir(layout.transcriptsDir, { recursive: true });

    const sessionManager = SessionManager.create(
      layout.workspaceDir,
      layout.transcriptsDir,
    );
    const sessionId = sessionManager.getSessionId();
    const sessionFile = sessionManager.getSessionFile();
    const label = normalizeOptionalString(params.label) ?? `${agent.name} session`;

    if (label) {
      sessionManager.appendSessionInfo(label);
    }

    sessionManager.appendCustomEntry("capyfin.agent", {
      agentId,
      modelId: agent.modelId,
      providerId: agent.providerId,
    });

    if (agent.providerId && agent.modelId) {
      sessionManager.appendModelChange(agent.providerId, agent.modelId);
    }

    const initialPrompt = normalizeOptionalString(params.initialPrompt);
    if (initialPrompt) {
      sessionManager.appendMessage({
        role: "user",
        content: [{ type: "text", text: initialPrompt }],
        timestamp: Date.now(),
      });
    }

    const timestamp = this.#timestamp();
    const summary: AgentSessionSummary = {
      id: sessionId,
      sessionKey: buildAgentSessionKey(agentId, sessionId),
      sessionFile: sessionFile ?? layout.transcriptsDir,
      createdAt: timestamp,
      updatedAt: timestamp,
      agentId,
      agentName: agent.name,
      workspaceDir: layout.workspaceDir,
      ...(label ? { label } : {}),
    };

    await persistSessionSnapshot(sessionManager, summary.sessionFile);

    const sessionStore = await loadAgentSessionStore(layout.sessionsIndexPath);
    sessionStore.sessions[sessionId] = {
      id: sessionId,
      sessionKey: summary.sessionKey,
      sessionFile: summary.sessionFile,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
      ...(summary.label ? { label: summary.label } : {}),
    };
    sessionStore.order = [
      sessionId,
      ...sessionStore.order.filter((candidate) => candidate !== sessionId),
    ];

    await saveAgentSessionStore(sessionStore, layout.sessionsIndexPath);
    return summary;
  }

  async getDefaultAgent(): Promise<AgentRecord> {
    const catalog = await this.getCatalog();
    return this.getAgent(catalog.defaultAgentId);
  }

  async getSession(
    agentId: string,
    sessionId: string,
  ): Promise<AgentSessionSummary> {
    const normalizedAgentId = normalizeAgentId(agentId);
    const sessions = await this.listSessions(normalizedAgentId);
    const session = sessions.find((candidate) => candidate.id === sessionId);

    if (!session) {
      throw new Error(
        `Session "${sessionId}" not found for agent "${normalizedAgentId}".`,
      );
    }

    return session;
  }

  async readSessionMessages(
    agentId: string,
    sessionId: string,
  ): Promise<AgentTranscriptMessage[]> {
    const session = await this.getSession(agentId, sessionId);
    const sessionManager = SessionManager.open(session.sessionFile);
    const messages: AgentTranscriptMessage[] = [];

    for (const entry of sessionManager.getEntries()) {
      if (entry.type !== "message") {
        continue;
      }

      if (entry.message.role !== "assistant" && entry.message.role !== "user") {
        continue;
      }

      const text =
        "content" in entry.message ? extractMessageText(entry.message.content) : "";
      if (!text.trim()) {
        continue;
      }

      messages.push({
        createdAt: entry.timestamp,
        id: entry.id,
        ...(entry.message.role === "assistant"
          ? {
              modelId: entry.message.model,
              providerId: entry.message.provider,
            }
          : {}),
        role: entry.message.role,
        text,
      });
    }

    return messages;
  }

  async appendSessionMessages(
    params: AppendSessionMessagesParams,
  ): Promise<AgentSessionSummary> {
    const normalizedAgentId = normalizeAgentId(params.agentId);
    const agent = await this.getAgent(normalizedAgentId);
    const session = await this.getSession(normalizedAgentId, params.sessionId);
    const messages = params.messages.filter(
      (message) => message.text.trim().length > 0,
    );

    if (messages.length === 0) {
      return session;
    }

    const sessionManager = SessionManager.open(session.sessionFile);
    for (const message of messages) {
      sessionManager.appendMessage(
        createTranscriptSessionMessage(
          message,
          agent.providerId,
          agent.modelId,
        ),
      );
    }

    await persistSessionSnapshot(sessionManager, session.sessionFile);
    return this.#touchSession(
      normalizedAgentId,
      params.sessionId,
      messages[messages.length - 1]?.createdAt ?? this.#timestamp(),
    );
  }

  async getOrCreateLatestSession(
    agentId: string,
    params: Omit<CreateAgentSessionParams, "agentId"> = {},
  ): Promise<AgentSessionSummary> {
    const normalizedAgentId = normalizeAgentId(agentId);
    const sessions = await this.listSessions(normalizedAgentId);
    const latestSession = sessions[0];

    if (latestSession) {
      return latestSession;
    }

    return this.createSession({
      ...params,
      agentId: normalizedAgentId,
    });
  }

  async #readStore(): Promise<AgentStore> {
    const store = await loadAgentStore(this.#storePath);
    return this.#ensureDefaultAgent(store);
  }

  #ensureDefaultAgent(store: AgentStore): AgentStore {
    const nextStore = {
      ...createEmptyAgentStore(),
      ...store,
      agents: { ...store.agents },
      order: [...store.order],
    };

    if (nextStore.order.length === 0 || !nextStore.agents[DEFAULT_AGENT_ID]) {
      const layout = resolveAgentFilesystemLayout(this.#location(), DEFAULT_AGENT_ID);
      const timestamp = this.#timestamp();
      nextStore.agents[DEFAULT_AGENT_ID] = {
        id: DEFAULT_AGENT_ID,
        name: DEFAULT_MAIN_AGENT_NAME,
        description: DEFAULT_MAIN_AGENT_DESCRIPTION,
        instructions: DEFAULT_MAIN_AGENT_INSTRUCTIONS,
        workspaceDir: layout.workspaceDir,
        createdAt:
          nextStore.agents[DEFAULT_AGENT_ID]?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      if (!nextStore.order.includes(DEFAULT_AGENT_ID)) {
        nextStore.order.unshift(DEFAULT_AGENT_ID);
      }
    }

    nextStore.defaultAgentId =
      nextStore.defaultAgentId && nextStore.agents[nextStore.defaultAgentId]
        ? nextStore.defaultAgentId
        : nextStore.order[0] ?? DEFAULT_AGENT_ID;

    return nextStore;
  }

  #toAgentRecord(record: StoredAgentRecord, defaultAgentId: string): AgentRecord {
    const layout = resolveAgentFilesystemLayout(
      this.#location(),
      record.id,
      record.workspaceDir,
    );
    return {
      ...record,
      agentDir: layout.agentDir,
      isDefault: record.id === defaultAgentId,
    };
  }

  #location() {
    return resolveAgentStoreLocation(this.#env, this.#storePath);
  }

  async #touchSession(
    agentId: string,
    sessionId: string,
    updatedAt: string,
  ): Promise<AgentSessionSummary> {
    const store = await this.#readStore();
    const agent = store.agents[agentId];
    if (!agent) {
      throw new Error(`Agent "${agentId}" not found.`);
    }

    const layout = resolveAgentFilesystemLayout(
      this.#location(),
      agentId,
      agent.workspaceDir,
    );
    const sessionStore = await loadAgentSessionStore(layout.sessionsIndexPath);
    const existing = sessionStore.sessions[sessionId];
    if (!existing) {
      throw new Error(`Session "${sessionId}" not found for agent "${agentId}".`);
    }

    sessionStore.sessions[sessionId] = {
      ...existing,
      updatedAt,
    };
    sessionStore.order = [
      sessionId,
      ...sessionStore.order.filter((candidate) => candidate !== sessionId),
    ];
    await saveAgentSessionStore(sessionStore, layout.sessionsIndexPath);

    return {
      ...sessionStore.sessions[sessionId],
      agentId,
      agentName: agent.name,
      workspaceDir: agent.workspaceDir,
    };
  }

  #timestamp(): string {
    return this.#now().toISOString();
  }
}

async function persistSessionSnapshot(
  sessionManager: SessionManager,
  sessionFile: string,
): Promise<void> {
  const header = sessionManager.getHeader();
  if (!header) {
    return;
  }

  const payload = [header, ...sessionManager.getEntries()]
    .map((entry) => JSON.stringify(entry))
    .join("\n");
  await writeFile(sessionFile, `${payload}\n`, "utf8");
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  return value?.trim() ? value.trim() : undefined;
}

function normalizeRequiredString(value: string | undefined, message: string): string {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    throw new Error(message);
  }

  return normalized;
}

function buildDefaultInstructions(agentName: string): string {
  return `You are ${agentName}, a CapyFin agent focused on finance planning, research, and execution support.`;
}

function extractMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .flatMap((part) => {
      if (!part || typeof part !== "object") {
        return [];
      }

      const record = part as Record<string, unknown>;
      if (record.type === "text" && typeof record.text === "string") {
        return [record.text];
      }

      return [];
    })
    .join("\n")
    .trim();
}

function createTranscriptSessionMessage(
  message: AgentTranscriptMessage,
  fallbackProviderId?: string,
  fallbackModelId?: string,
): AssistantMessage | UserMessage {
  if (message.role === "assistant") {
    const textContent: TextContent = {
      text: message.text,
      type: "text",
    };

    return {
      api: "chat",
      content: [textContent],
      model:
        message.modelId ??
        fallbackModelId ??
        "capyfin-chat",
      provider:
        message.providerId ??
        fallbackProviderId ??
        "capyfin",
      role: "assistant",
      stopReason: "stop",
      timestamp: new Date(message.createdAt).getTime(),
      usage: {
        cacheRead: 0,
        cacheWrite: 0,
        cost: {
          cacheRead: 0,
          cacheWrite: 0,
          input: 0,
          output: 0,
          total: 0,
        },
        input: 0,
        output: 0,
        totalTokens: 0,
      },
    };
  }

  return {
    content: message.text,
    role: "user",
    timestamp: new Date(message.createdAt).getTime(),
  };
}

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
import { WebSocket, type RawData } from "ws";
import packageJson from "../../package.json" with { type: "json" };
import {
  type Agent,
  type AgentCatalog,
  type AgentSession,
  type AgentSessionList,
  type ChatBootstrap,
  type ChatTranscriptMessage,
  type CreateAgentSessionRequest,
  type DeleteAgentResponse,
} from "@capyfin/contracts";
import { DEFAULT_AGENT_ID, normalizeAgentId } from "@capyfin/core/agents";
import {
  loadAuthStore,
  type AuthProfile,
  type ProviderAuthService,
} from "@capyfin/core/auth";
import type { AgentMetadataStoreService } from "./metadata-store.ts";
import {
  defaultModelForProvider,
  normalizeGatewayModelRef,
  splitGatewayModelRef,
} from "./model-defaults.ts";
import {
  resolveGatewayAgentDir,
  resolveGatewaySessionFile,
  resolveGatewaySessionsDir,
  type EmbeddedGatewayPaths,
} from "./paths.ts";
import { createSignedGatewayDevice } from "./device-identity.ts";
import type {
  CreateAgentRequest,
  UpdateAgentRequest,
} from "../server/types.ts";

interface GatewayAgentListResult {
  agents: {
    id: string;
    name?: string;
  }[];
  defaultId: string;
}

interface GatewayChatHistoryResult {
  messages: {
    id?: string;
    message?: {
      content?: {
        text?: string;
        type?: string;
      }[];
      role?: "assistant" | "system" | "user";
      timestamp?: number;
    };
    ts?: number;
  }[];
  sessionId?: string;
  sessionKey: string;
}

interface GatewayChatRunAck {
  runId: string;
  status: "accepted" | "in_flight" | "ok";
}

interface GatewayEventFrame {
  event: string;
  seq?: number;
  stateVersion?: number;
  type: "event";
  payload?: unknown;
}

interface GatewayResponseFrame {
  error?: {
    code?: string;
    details?: unknown;
    message?: string;
  };
  id: string;
  ok: boolean;
  payload?: unknown;
  type: "res";
}

interface GatewayRequestFrame {
  id: string;
  method: string;
  params?: unknown;
  type: "req";
}

interface PendingGatewayRequest {
  expectFinal: boolean;
  reject: (error: Error) => void;
  resolve: (value: unknown) => void;
}

interface GatewayRpcClientOptions {
  clientDisplayName?: string;
  clientName?: string;
  connectDelayMs?: number;
  identityPath: string;
  mode?: string;
  onClose?: (code: number, reason: string) => void;
  onConnectError?: (error: Error) => void;
  onEvent?: (event: GatewayEventFrame) => void;
  onHelloOk?: () => void;
  scopes?: string[];
  token?: string;
  url: string;
}

class GatewayRpcClient {
  readonly #options: GatewayRpcClientOptions;
  readonly #pending = new Map<string, PendingGatewayRequest>();
  #connectNonce: string | null = null;
  #connectSent = false;
  #connectTimer: NodeJS.Timeout | null = null;
  #socket: WebSocket | null = null;

  constructor(options: GatewayRpcClientOptions) {
    this.#options = options;
  }

  start(): void {
    this.#socket = new WebSocket(this.#options.url, {
      maxPayload: 25 * 1024 * 1024,
    });

    this.#socket.on("open", () => {
      this.#queueConnect();
    });
    this.#socket.on("message", (data: RawData) => {
      this.#handleMessage(data);
    });
    this.#socket.on("close", (code: number, reason: Buffer) => {
      this.stop();
      this.#options.onClose?.(code, reason.toString("utf8"));
    });
    this.#socket.on("error", (error: Error) => {
      this.#options.onConnectError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    });
  }

  stop(): void {
    if (this.#connectTimer) {
      clearTimeout(this.#connectTimer);
      this.#connectTimer = null;
    }

    const pendingError = new Error("gateway client stopped");
    for (const pending of this.#pending.values()) {
      pending.reject(pendingError);
    }
    this.#pending.clear();

    if (this.#socket) {
      this.#socket.removeAllListeners();
      this.#socket.close();
      this.#socket = null;
    }
  }

  request<T = unknown>(
    method: string,
    params?: unknown,
    options?: { expectFinal?: boolean },
  ): Promise<T> {
    if (!this.#socket || this.#socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("gateway not connected"));
    }

    const id = randomUUID();
    const frame: GatewayRequestFrame = {
      id,
      method,
      ...(params === undefined ? {} : { params }),
      type: "req",
    };

    return new Promise<T>((resolve, reject) => {
      this.#pending.set(id, {
        expectFinal: options?.expectFinal === true,
        reject,
        resolve: (value) => {
          resolve(value as T);
        },
      });
      this.#socket?.send(JSON.stringify(frame));
    });
  }

  #handleMessage(data: RawData): void {
    let parsed: unknown;
    try {
      const raw =
        typeof data === "string"
          ? data
          : Buffer.isBuffer(data)
            ? data.toString("utf8")
            : Array.isArray(data)
              ? Buffer.concat(data).toString("utf8")
              : Buffer.from(new Uint8Array(data)).toString("utf8");
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    if (!parsed || typeof parsed !== "object") {
      return;
    }

    const frame = parsed as Record<string, unknown>;
    if (frame.type === "event" && typeof frame.event === "string") {
      const event = frame as unknown as GatewayEventFrame;
      if (event.event === "connect.challenge") {
        const nonce =
          event.payload &&
          typeof event.payload === "object" &&
          typeof (event.payload as { nonce?: unknown }).nonce === "string"
            ? (event.payload as { nonce: string }).nonce.trim()
            : "";
        if (!nonce) {
          this.#options.onConnectError?.(new Error("gateway connect challenge missing nonce"));
          this.#socket?.close(1008, "connect challenge missing nonce");
          return;
        }
        this.#connectNonce = nonce;
        void this.#sendConnect();
        return;
      }

      this.#options.onEvent?.(event);
      return;
    }

    if (frame.type !== "res" || typeof frame.id !== "string") {
      return;
    }

    const response = frame as unknown as GatewayResponseFrame;
    const pending = this.#pending.get(response.id);
    if (!pending) {
      return;
    }

    const status =
      response.payload &&
      typeof response.payload === "object" &&
      "status" in response.payload
        ? (response.payload as { status?: unknown }).status
        : undefined;
    if (pending.expectFinal && status === "accepted") {
      return;
    }

    this.#pending.delete(response.id);
    if (response.ok) {
      pending.resolve(response.payload);
      return;
    }

    pending.reject(
      new Error(response.error?.message ?? response.error?.code ?? "gateway request failed"),
    );
  }

  #queueConnect(): void {
    this.#connectNonce = null;
    this.#connectSent = false;
    const timeoutMs = Math.max(250, this.#options.connectDelayMs ?? 2_000);
    this.#connectTimer = setTimeout(() => {
      const socket = this.#socket;
      if (this.#connectSent || socket?.readyState !== WebSocket.OPEN) {
        return;
      }

      this.#options.onConnectError?.(new Error("gateway connect challenge timeout"));
      socket.close(1008, "connect challenge timeout");
    }, timeoutMs);
    this.#connectTimer.unref();
  }

  async #sendConnect(): Promise<void> {
    if (this.#connectSent) {
      return;
    }

    const nonce = this.#connectNonce?.trim();
    if (!nonce) {
      this.#options.onConnectError?.(new Error("gateway connect challenge missing nonce"));
      this.#socket?.close(1008, "connect challenge missing nonce");
      return;
    }

    this.#connectSent = true;
    if (this.#connectTimer) {
      clearTimeout(this.#connectTimer);
      this.#connectTimer = null;
    }

    try {
      const scopes = this.#options.scopes ?? CLIENT_SCOPES;
      const signedDevice = await createSignedGatewayDevice({
        clientId: this.#options.clientName ?? CLIENT_NAME,
        clientMode: this.#options.mode ?? CLIENT_MODE,
        identityPath: this.#options.identityPath,
        nonce,
        platform: process.platform,
        role: "operator",
        scopes,
        ...(this.#options.token ? { token: this.#options.token } : {}),
      });

      await this.request(
        "connect",
        {
          auth: this.#options.token ? { token: this.#options.token } : undefined,
          caps: [],
          client: {
            displayName: this.#options.clientDisplayName,
            id: this.#options.clientName ?? CLIENT_NAME,
            mode: this.#options.mode ?? CLIENT_MODE,
            platform: process.platform,
            version: CLIENT_VERSION,
          },
          device: signedDevice.device,
          maxProtocol: 3,
          minProtocol: 3,
          role: "operator",
          scopes,
        },
        { expectFinal: false },
      );
      this.#options.onHelloOk?.();
    } catch (error: unknown) {
      this.#options.onConnectError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
      this.#socket?.close(1008, "connect failed");
    }
  }
}

interface GatewayChatEvent {
  errorMessage?: string;
  message?: {
    content?: {
      text?: string;
      type?: string;
    }[];
  };
  runId: string;
  sessionKey: string;
  state: "aborted" | "delta" | "error" | "final";
}

interface GatewaySessionRow {
  derivedTitle?: string;
  displayName?: string;
  key: string;
  label?: string;
  model?: string;
  modelProvider?: string;
  sessionId?: string;
  updatedAt: number | null;
}

interface GatewaySessionsListResult {
  sessions: GatewaySessionRow[];
}

interface GatewaySessionEntry {
  label?: string;
  model?: string;
  modelProvider?: string;
  sessionId: string;
  updatedAt?: number;
}

interface GatewaySessionsPatchResult {
  entry: GatewaySessionEntry;
  key: string;
}

interface GatewayConnectionTarget {
  token: string;
  url: string;
}

const CLIENT_NAME = "gateway-client";
const CLIENT_MODE = "backend";
const CLIENT_SCOPES = ["operator.admin", "operator.read", "operator.write"];
const CLIENT_VERSION = packageJson.version;

function extractMessageText(
  content?: {
    text?: string;
    type?: string;
  }[],
): string {
  return (content ?? [])
    .flatMap((part) => (part.type === "text" && typeof part.text === "string" ? [part.text] : []))
    .join("\n")
    .trim();
}

function toChatTranscriptMessage(
  value: GatewayChatHistoryResult["messages"][number],
): ChatTranscriptMessage | null {
  const role = value.message?.role;
  if (role !== "assistant" && role !== "system" && role !== "user") {
    return null;
  }

  return {
    createdAt: new Date(value.message?.timestamp ?? value.ts ?? Date.now()).toISOString(),
    id: value.id ?? randomUUID(),
    role,
    text: extractMessageText(value.message?.content),
  };
}

function resolveSessionLabel(row: GatewaySessionRow, agentName: string): string {
  return (
    row.label?.trim() ??
    row.displayName?.trim() ??
    row.derivedTitle?.trim() ??
    `${agentName} chat`
  );
}

function toAgentSession(params: {
  agent: Agent;
  paths: EmbeddedGatewayPaths;
  row: GatewaySessionRow;
}): AgentSession {
  const updatedAt = params.row.updatedAt
    ? new Date(params.row.updatedAt).toISOString()
    : new Date().toISOString();
  const sessionId = params.row.sessionId ?? params.row.key;

  return {
    agentId: params.agent.id,
    agentName: params.agent.name,
    createdAt: updatedAt,
    id: sessionId,
    label: resolveSessionLabel(params.row, params.agent.name),
    sessionFile: resolveGatewaySessionFile(params.paths, params.agent.id, sessionId),
    sessionKey: params.row.key,
    updatedAt,
    workspaceDir: params.agent.workspaceDir,
  };
}

function reorderIds<T extends { id: string }>(items: T[], preferredId?: string): T[] {
  if (!preferredId) {
    return items;
  }

  return [...items].sort((left, right) => {
    if (left.id === preferredId) {
      return -1;
    }
    if (right.id === preferredId) {
      return 1;
    }
    return 0;
  });
}

async function writeJsonFile(pathname: string, payload: unknown): Promise<void> {
  await mkdir(dirname(pathname), { recursive: true, mode: 0o700 });
  await writeFile(pathname, `${JSON.stringify(payload, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
}

function mapProfileCredential(profile: AuthProfile): Record<string, unknown> {
  const type = profile.type;
  if (type === "api_key") {
    return {
      key: profile.key,
      provider: profile.provider,
      type: "api_key",
    };
  }

  if (type === "token") {
    return {
      provider: profile.provider,
      token: profile.token,
      type: "token",
    };
  }

  return {
    ...(profile.credentials as Record<string, unknown>),
    provider: profile.provider,
    type: "oauth",
  };
}

export class EmbeddedGatewayClient {
  readonly #authService: ProviderAuthService;
  readonly #metadataStore: AgentMetadataStoreService;
  readonly #paths: EmbeddedGatewayPaths;
  readonly #target: GatewayConnectionTarget;

  constructor(params: {
    authService: ProviderAuthService;
    metadataStore: AgentMetadataStoreService;
    paths: EmbeddedGatewayPaths;
    target: GatewayConnectionTarget;
  }) {
    this.#authService = params.authService;
    this.#metadataStore = params.metadataStore;
    this.#paths = params.paths;
    this.#target = params.target;
  }

  async syncAuthProfiles(): Promise<void> {
    const store = await loadAuthStore(this.#authService.getStorePath());
    const profiles = Object.fromEntries(
      Object.entries(store.profiles).map(([profileId, profile]) => [
        profileId,
        mapProfileCredential(profile),
      ]),
    );
    const order = Object.fromEntries(
      Object.entries(store.order).map(([providerId, profileIds]) => {
        const activeProfileId =
          store.activeProfileId &&
          profileIds.includes(store.activeProfileId) &&
          store.profiles[store.activeProfileId]?.provider === providerId
            ? store.activeProfileId
            : undefined;

        return [
          providerId,
          activeProfileId
            ? [activeProfileId, ...profileIds.filter((profileId) => profileId !== activeProfileId)]
            : profileIds,
        ];
      }),
    );

    const payload = {
      order,
      profiles,
      version: 1,
    };
    const catalog = await this.#metadataStore.listCatalog();
    const agentIds = new Set(
      [DEFAULT_AGENT_ID, ...catalog.agents.map((agent) => normalizeAgentId(agent.id))].filter(
        Boolean,
      ),
    );

    await Promise.all(
      [...agentIds].map(async (agentId) => {
        const authStorePath = `${resolveGatewayAgentDir(this.#paths, agentId)}/auth-profiles.json`;
        await writeJsonFile(authStorePath, payload);
      }),
    );
  }

  async getCatalog(): Promise<AgentCatalog> {
    const metadataCatalog = await this.#metadataStore.listCatalog();
    const gatewayCatalog = await this.request<GatewayAgentListResult>("agents.list", {});
    const availableIds = new Set(
      gatewayCatalog.agents.map((agent) => normalizeAgentId(agent.id)),
    );

    return {
      agents: reorderIds(
        metadataCatalog.agents.filter((agent) => availableIds.has(agent.id)),
        metadataCatalog.defaultAgentId,
      ),
      defaultAgentId: metadataCatalog.defaultAgentId,
      storePath: metadataCatalog.storePath,
    };
  }

  async getAgent(agentId: string): Promise<Agent> {
    return await this.#metadataStore.getAgent(agentId);
  }

  async getDefaultAgent(): Promise<Agent> {
    const catalog = await this.getCatalog();
    const agent =
      catalog.agents.find((candidate) => candidate.id === catalog.defaultAgentId) ??
      catalog.agents[0];
    if (!agent) {
      throw new Error("No agents are configured.");
    }
    return agent;
  }

  async createAgent(payload: CreateAgentRequest): Promise<Agent> {
    const metadata = await this.#metadataStore.createAgent(payload);
    const result = await this.request<{ agentId: string }>("agents.create", {
      name: metadata.name,
      workspace: metadata.workspaceDir,
    });

    if (result.agentId !== metadata.id) {
      throw new Error(
        `Embedded runtime created agent ${result.agentId}, but ${metadata.id} was expected.`,
      );
    }

    await this.applyAgentWorkspace(metadata);
    await this.syncAuthProfiles();
    return metadata;
  }

  async updateAgent(agentId: string, payload: UpdateAgentRequest): Promise<Agent> {
    const metadata = await this.#metadataStore.updateAgent(agentId, payload);
    const model = normalizeGatewayModelRef(metadata);
    await this.request("agents.update", {
      agentId: metadata.id,
      ...(payload.name?.trim() ? { name: metadata.name } : {}),
      ...(model ? { model } : {}),
      ...(payload.workspaceDir?.trim() ? { workspace: metadata.workspaceDir } : {}),
    });

    await this.applyAgentWorkspace(metadata);
    return metadata;
  }

  async deleteAgent(agentId: string): Promise<DeleteAgentResponse> {
    const sessions = await this.listSessions(agentId);
    const metadata = await this.#metadataStore.deleteAgent(agentId);
    await this.request("agents.delete", {
      agentId: normalizeAgentId(agentId),
      deleteFiles: true,
    });

    return {
      agentId: normalizeAgentId(agentId),
      deletedSessions: sessions.sessions.length,
      removedPaths: metadata.removedAgent
        ? [
            metadata.removedAgent.agentDir,
            metadata.removedAgent.workspaceDir,
            resolveGatewaySessionsDir(this.#paths, metadata.removedAgent.id),
          ]
        : [],
    };
  }

  async listSessions(agentId?: string): Promise<AgentSessionList> {
    const catalog = await this.getCatalog();
    const agentMap = new Map(catalog.agents.map((agent) => [agent.id, agent]));
    const rows = await this.request<GatewaySessionsListResult>("sessions.list", {
      agentId: agentId?.trim(),
      includeDerivedTitles: true,
      includeLastMessage: false,
      limit: 100,
    });
    const sessions = rows.sessions
      .map((row) => {
        const normalizedAgentId = row.key.startsWith("agent:")
          ? normalizeAgentId(row.key.split(":")[1] ?? DEFAULT_AGENT_ID)
          : DEFAULT_AGENT_ID;
        const agent = agentMap.get(normalizedAgentId);
        return agent ? toAgentSession({ agent, paths: this.#paths, row }) : null;
      })
      .filter((session): session is AgentSession => Boolean(session))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    return {
      ...(agentId ? { agentId } : {}),
      sessions,
    };
  }

  async createSession(payload: CreateAgentSessionRequest): Promise<AgentSession> {
    const agent = await this.getAgent(payload.agentId);
    const sessionKey = `agent:${agent.id}:session:${randomUUID()}`;
    const patch = await this.request<GatewaySessionsPatchResult>("sessions.patch", {
      key: sessionKey,
      ...(payload.label?.trim() ? { label: payload.label.trim() } : {}),
      ...(normalizeGatewayModelRef(agent)
        ? { model: normalizeGatewayModelRef(agent) }
        : {}),
    });

    if (payload.initialPrompt?.trim()) {
      await this.request<GatewayChatRunAck>(
        "chat.send",
        {
          idempotencyKey: randomUUID(),
          message: payload.initialPrompt.trim(),
          sessionKey,
        },
        { expectFinal: false },
      );
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      createdAt: new Date(patch.entry.updatedAt ?? Date.now()).toISOString(),
      id: patch.entry.sessionId,
      ...(payload.label?.trim() ? { label: payload.label.trim() } : {}),
      sessionFile: resolveGatewaySessionFile(this.#paths, agent.id, patch.entry.sessionId),
      sessionKey: patch.key,
      updatedAt: new Date(patch.entry.updatedAt ?? Date.now()).toISOString(),
      workspaceDir: agent.workspaceDir,
    };
  }

  async bootstrapConversation(agentId = DEFAULT_AGENT_ID): Promise<ChatBootstrap> {
    const agent = await this.getAgent(agentId);
    const authOverview = await this.#authService.getOverview();
    const fallbackProviderId = agent.providerId ?? authOverview.selectedProviderId;
    const fallbackModelRef =
      normalizeGatewayModelRef({
        modelId: agent.modelId,
        providerId: fallbackProviderId,
      }) ?? defaultModelForProvider(fallbackProviderId);
    const session = await this.ensureConversationSession({
      agent,
      ...(fallbackModelRef ? { fallbackModelRef } : {}),
    });
    const history = await this.request<GatewayChatHistoryResult>("chat.history", {
      limit: 200,
      sessionKey: session.sessionKey,
    });
    const catalog = await this.getCatalog();
    const resolved = splitGatewayModelRef(fallbackModelRef);

    return {
      agent,
      agents: catalog.agents,
      messages: history.messages
        .map((message) => toChatTranscriptMessage(message))
        .filter((message): message is ChatTranscriptMessage => Boolean(message)),
      ...(resolved.modelId ? { resolvedModelId: resolved.modelId } : {}),
      ...(resolved.providerId ? { resolvedProviderId: resolved.providerId } : {}),
      session,
    };
  }

  async streamConversation(params: {
    agentId?: string;
    message: UIMessage;
    sessionId?: string;
  }): Promise<Response> {
    const agent = params.agentId
      ? await this.getAgent(params.agentId)
      : await this.getDefaultAgent();
    const authOverview = await this.#authService.getOverview();
    const fallbackProviderId = agent.providerId ?? authOverview.selectedProviderId;
    const fallbackModelRef =
      normalizeGatewayModelRef({
        modelId: agent.modelId,
        providerId: fallbackProviderId,
      }) ?? defaultModelForProvider(fallbackProviderId);
    const session = await this.ensureConversationSession({
      agent,
      ...(fallbackModelRef ? { fallbackModelRef } : {}),
      ...(params.sessionId ? { requestedSessionId: params.sessionId } : {}),
    });
    const userText = params.message.parts
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join("\n")
      .trim();
    if (!userText) {
      throw new Error("Chat message cannot be empty.");
    }

    const bootstrap = await this.bootstrapConversation(agent.id);
    const originalMessages = [
      ...bootstrap.messages.map((message) => ({
        id: message.id,
        parts: message.text
          ? [{ text: message.text, type: "text" as const }]
          : [],
        role: message.role,
      })),
      params.message,
    ];
    const assistantMessageId = randomUUID();

    const stream = createUIMessageStream<UIMessage>({
      execute: async ({ writer }) => {
        let runId = "";
        let currentAssistantText = "";
        let started = false;
        let finishedResolve!: () => void;
        let finishedReject!: (error: Error) => void;
        const finished = new Promise<void>((resolve, reject) => {
          finishedResolve = resolve;
          finishedReject = reject;
        });

        const streamClient = await this.connect({
          onEvent: (event) => {
            const payload =
              event.event === "chat" && event.payload && typeof event.payload === "object"
                ? (event.payload as GatewayChatEvent)
                : null;
            if (payload?.sessionKey !== session.sessionKey || payload.runId !== runId) {
              return;
            }

            if (payload.state === "delta") {
              const fullText = extractMessageText(payload.message?.content);
              const nextDelta = fullText.slice(currentAssistantText.length);
              if (!started && fullText) {
                writer.write({ id: assistantMessageId, type: "text-start" });
                started = true;
              }
              if (nextDelta) {
                currentAssistantText = fullText;
                writer.write({
                  delta: nextDelta,
                  id: assistantMessageId,
                  type: "text-delta",
                });
              }
              return;
            }

            if (payload.state === "final") {
              const fullText = extractMessageText(payload.message?.content);
              const trailing = fullText.slice(currentAssistantText.length);
              if (!started) {
                writer.write({ id: assistantMessageId, type: "text-start" });
                started = true;
              }
              if (trailing) {
                writer.write({
                  delta: trailing,
                  id: assistantMessageId,
                  type: "text-delta",
                });
              }
              writer.write({ id: assistantMessageId, type: "text-end" });
              writer.write({ finishReason: "stop", type: "finish" });
              finishedResolve();
              return;
            }

            if (payload.state === "error") {
              const message =
                payload.errorMessage ?? "The assistant could not complete the turn.";
              writer.write({
                errorText: message,
                type: "error",
              });
              finishedReject(new Error(message));
            }
          },
        });

        try {
          const ack = await streamClient.request<GatewayChatRunAck>(
            "chat.send",
            {
              idempotencyKey: params.message.id,
              message: userText,
              sessionKey: session.sessionKey,
            },
            { expectFinal: false },
          );
          runId = ack.runId;
          await finished;
        } finally {
          streamClient.stop();
        }
      },
      originalMessages,
    });

    return createUIMessageStreamResponse({
      headers: {
        "x-capyfin-agent-id": agent.id,
        ...(fallbackProviderId ? { "x-capyfin-provider-id": fallbackProviderId } : {}),
        ...(fallbackModelRef ? { "x-capyfin-model-id": fallbackModelRef } : {}),
      },
      stream,
    });
  }

  async applyAgentWorkspace(agent: Agent): Promise<void> {
    const descriptionLine = agent.description?.trim()
      ? `\nDescription: ${agent.description.trim()}\n`
      : "\n";
    await this.request("agents.files.set", {
      agentId: agent.id,
      content: `# SOUL.md - ${agent.name}\n\n${agent.instructions.trim()}\n`,
      name: "SOUL.md",
    });
    await this.request("agents.files.set", {
      agentId: agent.id,
      content: `# IDENTITY.md - ${agent.name}\n\n- Name: ${agent.name}${descriptionLine}`,
      name: "IDENTITY.md",
    });
    await this.request("agents.files.set", {
      agentId: agent.id,
      content: `# USER.md - CapyFin Workspace\n\n- Product: CapyFin\n- Agent ID: ${agent.id}\n`,
      name: "USER.md",
    });
    if (normalizeGatewayModelRef(agent)) {
      await this.request("agents.update", {
        agentId: agent.id,
        model: normalizeGatewayModelRef(agent),
      });
    }
  }

  private async ensureConversationSession(params: {
    agent: Agent;
    requestedSessionId?: string;
    fallbackModelRef?: string;
  }): Promise<AgentSession> {
    if (params.requestedSessionId) {
      const sessions = await this.listSessions(params.agent.id);
      const existing = sessions.sessions.find(
        (candidate) => candidate.id === params.requestedSessionId,
      );
      if (existing) {
        return existing;
      }
    }

    const sessions = await this.request<GatewaySessionsListResult>("sessions.list", {
      agentId: params.agent.id,
      includeDerivedTitles: true,
      limit: 25,
    });
    const latest = sessions.sessions[0];
    if (latest?.sessionId) {
      return toAgentSession({ agent: params.agent, paths: this.#paths, row: latest });
    }

    const key = `agent:${params.agent.id}:main`;
    const patch = await this.request<GatewaySessionsPatchResult>("sessions.patch", {
      key,
      label: `${params.agent.name} chat`,
      ...(params.fallbackModelRef ? { model: params.fallbackModelRef } : {}),
    });

    return {
      agentId: params.agent.id,
      agentName: params.agent.name,
      createdAt: new Date(patch.entry.updatedAt ?? Date.now()).toISOString(),
      id: patch.entry.sessionId,
      label: `${params.agent.name} chat`,
      sessionFile: resolveGatewaySessionFile(this.#paths, params.agent.id, patch.entry.sessionId),
      sessionKey: patch.key,
      updatedAt: new Date(patch.entry.updatedAt ?? Date.now()).toISOString(),
      workspaceDir: params.agent.workspaceDir,
    };
  }

  private async request<T>(
    method: string,
    params?: unknown,
    options?: { expectFinal?: boolean },
  ): Promise<T> {
    const client = await this.connect();
    try {
      return await client.request<T>(method, params, options);
    } finally {
      client.stop();
    }
  }

  private async connect(options?: {
    onEvent?: (event: GatewayEventFrame) => void;
  }): Promise<{
    request<T = unknown>(
      method: string,
      params?: unknown,
      requestOptions?: { expectFinal?: boolean },
    ): Promise<T>;
    stop(): void;
  }> {
    return await new Promise((resolve, reject) => {
      let settled = false;
      const client = new GatewayRpcClient({
        clientDisplayName: "CapyFin",
        clientName: CLIENT_NAME,
        connectDelayMs: 0,
        identityPath: this.#paths.deviceIdentityPath,
        mode: CLIENT_MODE,
        onClose: (code, reason) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(
              new Error(
                `Embedded runtime closed during connect (${String(code)}): ${reason}`,
              ),
            );
          }
        },
        onConnectError: (error) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(error);
          }
        },
        ...(options?.onEvent ? { onEvent: options.onEvent } : {}),
        onHelloOk: () => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timeout);
          resolve(client);
        },
        scopes: CLIENT_SCOPES,
        token: this.#target.token,
        url: this.#target.url.replace(/^http/i, "ws"),
      });

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          client.stop();
          reject(new Error("Timed out connecting to the embedded runtime."));
        }
      }, 10_000);
      timeout.unref();
      client.start();
    });
  }
}

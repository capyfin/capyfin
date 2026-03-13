import {
  DEFAULT_AGENT_ID,
  type AgentRecord,
  type AgentService,
  type AgentSessionSummary,
  type AgentTranscriptMessage,
} from "@capyfin/core/agents";
import type {
  ProviderAuthService,
  ResolvedProviderCredential,
} from "@capyfin/core/auth";
import {
  type ChatBootstrap,
  type ChatTranscriptMessage,
} from "@capyfin/contracts";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  type LanguageModel,
  type UIMessage,
  type UIMessageStreamOptions,
} from "ai";

export interface AgentChatServiceOptions {
  agentService: AgentService;
  authService: ProviderAuthService;
  executeStream?: ChatStreamExecutor;
}

interface ResolvedConversation {
  agent: AgentRecord;
  messages: ChatTranscriptMessage[];
  resolvedModelId?: string;
  resolvedProviderId?: string;
  session: AgentSessionSummary;
}

interface ChatStreamResult {
  consumeStream(): PromiseLike<void>;
  toUIMessageStreamResponse<UI_MESSAGE extends UIMessage>(
    options?: ResponseInit & UIMessageStreamOptions<UI_MESSAGE>,
  ): Response;
}

type ChatStreamExecutor = (params: {
  messages: Awaited<ReturnType<typeof convertToModelMessages>>;
  model: LanguageModel;
  system: string;
}) => ChatStreamResult;

export class AgentChatService {
  readonly #agentService: AgentService;
  readonly #authService: ProviderAuthService;
  readonly #executeStream: ChatStreamExecutor;

  constructor(options: AgentChatServiceOptions) {
    this.#agentService = options.agentService;
    this.#authService = options.authService;
    this.#executeStream =
      options.executeStream ??
      ((params) =>
        streamText({
          messages: params.messages,
          model: params.model,
          system: params.system,
        }));
  }

  async bootstrapConversation(
    agentId = DEFAULT_AGENT_ID,
  ): Promise<ChatBootstrap> {
    const conversation = await this.#resolveConversation({ agentId });
    const catalog = await this.#agentService.getCatalog();

    return {
      agent: conversation.agent,
      agents: catalog.agents,
      messages: conversation.messages,
      session: conversation.session,
      ...(conversation.resolvedModelId
        ? { resolvedModelId: conversation.resolvedModelId }
        : {}),
      ...(conversation.resolvedProviderId
        ? { resolvedProviderId: conversation.resolvedProviderId }
        : {}),
    };
  }

  async streamConversation(params: {
    agentId?: string;
    message: UIMessage;
    sessionId?: string;
  }): Promise<Response> {
    const conversation = await this.#resolveConversation({
      ...(params.agentId ? { agentId: params.agentId } : {}),
      ...(params.sessionId ? { sessionId: params.sessionId } : {}),
    });
    const providerSelection = await this.#resolveProviderSelection(conversation.agent);
    const resolvedProvider = {
      model: createLanguageModel(
        providerSelection.providerId,
        providerSelection.credential,
        providerSelection.modelId,
      ),
      modelId: providerSelection.modelId,
      providerId: providerSelection.providerId,
    };
    const userText = extractTextFromUiMessage(params.message);
    if (!userText) {
      throw new Error("Chat message cannot be empty.");
    }

    const originalMessages = [
      ...conversation.messages.map(toUiMessage),
      toUiMessage({
        createdAt: new Date().toISOString(),
        id: params.message.id,
        role: "user",
        text: userText,
      }),
    ];
    const modelMessages = await convertToModelMessages(
      originalMessages.map(stripMessageId),
    );
    const result = this.#executeStream({
      messages: modelMessages,
      model: resolvedProvider.model,
      system: conversation.agent.instructions,
    });

    void Promise.resolve(result.consumeStream());

    return result.toUIMessageStreamResponse({
      headers: {
        "x-capyfin-agent-id": conversation.agent.id,
        "x-capyfin-model-id": resolvedProvider.modelId,
        "x-capyfin-provider-id": resolvedProvider.providerId,
      },
      onFinish: async ({ messages }: { messages: UIMessage[] }) => {
        const assistantMessage = findLatestAssistantMessage(messages);
        if (!assistantMessage) {
          return;
        }

        await this.#agentService.appendSessionMessages({
          agentId: conversation.agent.id,
          messages: [
            {
              createdAt: new Date().toISOString(),
              id: params.message.id,
              role: "user",
              text: userText,
            },
            {
              createdAt: new Date().toISOString(),
              id: assistantMessage.id,
              modelId: resolvedProvider.modelId,
              providerId: resolvedProvider.providerId,
              role: "assistant",
              text: extractTextFromUiMessage(assistantMessage),
            },
          ],
          sessionId: conversation.session.id,
        });
      },
      originalMessages,
    });
  }

  async #resolveConversation(params: {
    agentId?: string;
    sessionId?: string;
  }): Promise<ResolvedConversation> {
    const agent = params.agentId
      ? await this.#agentService.getAgent(params.agentId)
      : await this.#agentService.getDefaultAgent();
    let session = params.sessionId
      ? await this.#agentService.getSession(agent.id, params.sessionId)
      : await this.#agentService.getOrCreateLatestSession(agent.id, {
          label: `${agent.name} chat`,
        });
    let messages: ChatTranscriptMessage[];

    try {
      messages = await this.#agentService.readSessionMessages(agent.id, session.id);
    } catch (error) {
      if (!isRecoverableSessionReadError(error)) {
        throw error;
      }

      session = await this.#agentService.createSession({
        agentId: agent.id,
        label: `${agent.name} chat`,
      });
      messages = [];
    }

    const authOverview = await this.#authService.getOverview();
    const fallbackProviderId = agent.providerId ?? authOverview.selectedProviderId;
    const fallbackModelId = fallbackProviderId
      ? agent.modelId ?? defaultModelIdForProvider(fallbackProviderId)
      : undefined;

    try {
      const resolvedProvider = await this.#resolveProviderSelection(agent);
      return {
        agent,
        messages,
        resolvedModelId: resolvedProvider.modelId,
        resolvedProviderId: resolvedProvider.providerId,
        session,
      };
    } catch {
      return {
        agent,
        messages,
        ...(fallbackModelId ? { resolvedModelId: fallbackModelId } : {}),
        ...(fallbackProviderId ? { resolvedProviderId: fallbackProviderId } : {}),
        session,
      };
    }
  }

  async #resolveProviderSelection(agent: AgentRecord): Promise<{
    credential: ResolvedProviderCredential;
    modelId: string;
    providerId: string;
  }> {
    const resolvedCredential = await this.#authService.resolveCredential(
      agent.providerId,
    );

    if (!resolvedCredential) {
      throw new Error("Connect a model provider before starting chat.");
    }

    const providerId = agent.providerId ?? resolvedCredential.providerId;
    const modelId =
      agent.modelId ?? defaultModelIdForProvider(providerId);

    if (!modelId) {
      throw new Error(
        `Chat requires a model for ${providerId}. Set a model on the agent first.`,
      );
    }

    return {
      credential: resolvedCredential,
      modelId,
      providerId,
    };
  }
}

function createLanguageModel(
  providerId: string,
  credential: ResolvedProviderCredential,
  modelId: string,
): LanguageModel {
  const secret = credential.secret;
  if (!secret) {
    throw new Error(`Missing credentials for ${providerId}.`);
  }

  switch (providerId) {
    case "anthropic":
      return createAnthropic({ apiKey: secret })(modelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey: secret })(modelId);
    case "openai":
      return createOpenAI({ apiKey: secret })(modelId);
    default:
      throw new Error(
        `${providerId} chat is not available yet. Connect OpenAI, Anthropic, or Google to start chatting now.`,
      );
  }
}

function defaultModelIdForProvider(providerId: string): string | undefined {
  switch (providerId) {
    case "anthropic":
      return "claude-sonnet-4-5";
    case "google":
      return "gemini-2.5-pro";
    case "openai":
      return "gpt-5";
    default:
      return undefined;
  }
}

function findLatestAssistantMessage(messages: UIMessage[]): UIMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "assistant") {
      return message;
    }
  }

  return null;
}

function extractTextFromUiMessage(message: UIMessage): string {
  return message.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n")
    .trim();
}

function toUiMessage(message: AgentTranscriptMessage): UIMessage {
  return {
    id: message.id,
    metadata: {
      createdAt: message.createdAt,
    },
    parts: message.text
      ? [
          {
            text: message.text,
            type: "text" as const,
          },
        ]
      : [],
    role: message.role,
  };
}

function stripMessageId(message: UIMessage): Omit<UIMessage, "id"> {
  const nextMessage = { ...message };
  delete (nextMessage as { id?: string }).id;
  return nextMessage;
}

function isRecoverableSessionReadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('Session "') &&
    error.message.includes('" not found for agent "')
  );
}

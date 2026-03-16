import { useChat } from "@ai-sdk/react";
import {
  BotIcon,
  ClipboardIcon,
  LoaderCircleIcon,
  SparklesIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthOverview, ChatBootstrap } from "@/app/types";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Button } from "@/components/ui/button";
import {
  chatDataPartSchemas,
  getActivityParts,
  getReasoningText,
  getTextParts,
  type ChatUIMessage,
} from "@/features/chat/message-parts";
import { createChatTransport } from "@/features/chat/transport";
import { SidecarClient } from "@/lib/sidecar/client";

interface ChatWorkspaceProps {
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
}

const STARTER_PROMPTS = [
  "Review my current portfolio risk and call out the biggest concerns.",
  "Build me a weekly cash flow and investing routine.",
  "What should I prepare before harvesting tax losses?",
];

export function ChatWorkspace({
  authOverview,
  client,
}: ChatWorkspaceProps) {
  const [bootstrap, setBootstrap] = useState<ChatBootstrap | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadChat(): Promise<void> {
      if (!client) {
        if (!cancelled) {
          setBootstrap(null);
          setErrorMessage("Chat is unavailable right now.");
          setIsLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setIsLoading(true);
        setErrorMessage(null);
      }

      try {
        const nextBootstrap = await client.chatBootstrap("main");
        if (!cancelled) {
          setBootstrap(nextBootstrap);
        }
      } catch (error) {
        console.error("Failed to bootstrap chat", error);
        if (!cancelled) {
          setBootstrap(null);
          setErrorMessage(
            error instanceof Error ? error.message : "Chat is unavailable right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadChat();

    return () => {
      cancelled = true;
    };
  }, [client, refreshToken]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Loading chat</p>
        </div>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div className="flex flex-1 flex-col items-start gap-3 px-4 py-6 lg:px-6">
        <div className="rounded-lg border border-warning/20 bg-warning/8 px-3.5 py-2.5 text-sm text-warning-foreground">
          {errorMessage ?? "Chat is unavailable right now."}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshToken((current) => current + 1);
            }}
          >
            Retry
          </Button>
          <Button asChild size="sm">
            <a href="#connections">Manage providers</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ChatSessionView
      key={bootstrap.session.id}
      authOverview={authOverview}
      bootstrap={bootstrap}
      client={client}
    />
  );
}

function ChatSessionView({
  authOverview,
  bootstrap,
  client,
}: {
  authOverview: AuthOverview | null;
  bootstrap: ChatBootstrap;
  client: SidecarClient | null;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [transport] = useState(
    () =>
      createChatTransport({
        agentId: bootstrap.agent.id,
        client,
        sessionId: bootstrap.session.id,
      }),
  );
  const {
    error,
    messages,
    sendMessage,
    status,
    stop,
  } = useChat<ChatUIMessage>({
    dataPartSchemas: chatDataPartSchemas,
    id: bootstrap.session.id,
    messages: bootstrap.messages.map(toUiMessage),
    transport,
  });

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    list.scrollTo({
      behavior: "smooth",
      top: list.scrollHeight,
    });
  }, [messages, status]);

  const isStreaming = status === "streaming" || status === "submitted";
  const latestMessage = messages[messages.length - 1];
  const providerName =
    authOverview?.providers.find(
      (provider) =>
        provider.methods.some((method) => method.providerId === bootstrap.resolvedProviderId),
    )?.name ?? bootstrap.resolvedProviderId;

  const handleSubmit = useCallback(
    async (prompt: { text: string }) => {
      const text = prompt.text.trim();
      if (!text || isStreaming) {
        return;
      }
      await sendMessage({ text });
    },
    [isStreaming, sendMessage],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Agent/provider bar */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 lg:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <BotIcon className="size-3" />
            {bootstrap.agent.name}
          </span>
          {providerName ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {providerName}
              {bootstrap.resolvedModelId ? ` / ${bootstrap.resolvedModelId}` : ""}
            </span>
          ) : null}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 lg:px-6"
      >
        {messages.length === 0 ? (
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 py-8 text-center">
            <div className="space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SparklesIcon className="size-5" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  Start a conversation
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Ask {bootstrap.agent.name} about planning, analysis, and finance decisions.
                </p>
              </div>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-3">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-lg border border-border/60 bg-card px-3.5 py-3 text-left text-sm leading-relaxed text-muted-foreground transition-all duration-150 hover:border-primary/30 hover:bg-accent hover:text-foreground"
                  onClick={() => {
                    void handleSubmit({ text: prompt });
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              isStreaming={isStreaming && latestMessage?.id === message.id}
              message={message}
            />
          ))
        )}

        {isStreaming && latestMessage?.role === "user" ? (
          <Message from="assistant">
            <Reasoning isStreaming>
              <ReasoningTrigger />
            </Reasoning>
          </Message>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}
      </div>

      {/* Chat input */}
      <div className="border-t border-border/60 px-4 py-3 lg:px-6">
        <PromptInput
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl"
        >
          <PromptInputTextarea
            placeholder={`Message ${bootstrap.agent.name}...`}
            disabled={isStreaming}
          />
          <PromptInputSubmit
            status={status}
            onStop={() => {
              void stop();
            }}
          />
        </PromptInput>
      </div>
    </div>
  );
}

function ChatMessage({
  isStreaming,
  message,
}: {
  isStreaming: boolean;
  message: ChatUIMessage;
}) {
  const activityParts = getActivityParts(message);
  const reasoningText = getReasoningText(message);
  const textParts = getTextParts(message);
  const fullText = textParts.join("\n\n");
  const isThinking =
    message.role === "assistant" &&
    isStreaming &&
    activityParts.some((activity) => activity.status === "active");

  if (message.role === "user") {
    return (
      <Message from="user">
        <MessageContent>
          {textParts.map((part, index) => (
            <p key={`${message.id}-${String(index)}`} className="whitespace-pre-wrap">
              {part}
            </p>
          ))}
        </MessageContent>
      </Message>
    );
  }

  return (
    <Message from="assistant">
      {activityParts.length > 0 || isThinking ? (
        <Reasoning isStreaming={isThinking} defaultOpen={false}>
          <ReasoningTrigger />
        </Reasoning>
      ) : null}

      {reasoningText ? (
        <Reasoning defaultOpen={false}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
      ) : null}

      {fullText ? (
        <MessageContent>
          <MessageResponse>{fullText}</MessageResponse>
          <MessageToolbar>
            <MessageActions>
              <CopyAction text={fullText} />
            </MessageActions>
          </MessageToolbar>
        </MessageContent>
      ) : null}
    </Message>
  );
}

function CopyAction({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <MessageAction
      tooltip={copied ? "Copied!" : "Copy"}
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => {
          setCopied(false);
        }, 1500);
      }}
    >
      <ClipboardIcon className="size-3.5" />
    </MessageAction>
  );
}

function toUiMessage(message: ChatBootstrap["messages"][number]): ChatUIMessage {
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

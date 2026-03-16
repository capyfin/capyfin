import { useChat } from "@ai-sdk/react";
import {
  ArrowUpIcon,
  BotIcon,
  BrainCogIcon,
  LoaderCircleIcon,
  SparklesIcon,
  SquareIcon,
  WrenchIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatActivity } from "@capyfin/contracts";
import type { AuthOverview, ChatBootstrap } from "@/app/types";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  ChainOfThoughtToolIcon,
} from "@/components/ai-elements/chain-of-thought";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  chatDataPartSchemas,
  getActivityParts,
  getReasoningText,
  getTextParts,
  type ChatUIMessage,
} from "@/features/chat/message-parts";
import { createChatTransport } from "@/features/chat/transport";
import { cn } from "@/lib/utils";
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
          <p className="text-[12px] text-muted-foreground">Loading chat</p>
        </div>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div className="flex flex-1 flex-col items-start gap-3 px-4 py-6 lg:px-6">
        <div className="rounded-lg border border-warning/20 bg-warning/8 px-3.5 py-2.5 text-[13px] text-warning-foreground">
          {errorMessage ?? "Chat is unavailable right now."}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-md text-[12px]"
            onClick={() => {
              setRefreshToken((current) => current + 1);
            }}
          >
            Retry
          </Button>
          <Button asChild size="sm" className="h-8 rounded-md text-[12px]">
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
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
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
    const target = textareaRef.current;
    if (!target) {
      return;
    }

    target.style.height = "0px";
    target.style.height = `${String(target.scrollHeight)}px`;
  }, [draft]);

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

  async function submitPrompt(prompt: string): Promise<void> {
    const nextPrompt = prompt.trim();
    if (!nextPrompt || isStreaming) {
      return;
    }

    setDraft("");
    await sendMessage({ text: nextPrompt });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Agent/provider bar */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 lg:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            <BotIcon className="size-2.5" />
            {bootstrap.agent.name}
          </span>
          {providerName ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {providerName}
              {bootstrap.resolvedModelId ? ` / ${bootstrap.resolvedModelId}` : ""}
            </span>
          ) : null}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 lg:px-5"
      >
        {messages.length === 0 ? (
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
            <div className="space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SparklesIcon className="size-5" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  Start a conversation
                </h1>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Ask {bootstrap.agent.name} about planning, analysis, and finance decisions.
                </p>
              </div>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-3">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-lg border border-border/60 bg-card px-3 py-3 text-left text-[12px] leading-relaxed text-muted-foreground transition-all duration-150 hover:border-primary/30 hover:bg-accent hover:text-foreground"
                  onClick={() => {
                    void submitPrompt(prompt);
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={cn(
                "flex w-full",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <MessageBubble
                agentName={bootstrap.agent.name}
                isStreaming={isStreaming && latestMessage?.id === message.id}
                message={message}
              />
            </article>
          ))
        )}

        {isStreaming && latestMessage?.role === "user" ? (
          <article className="flex w-full justify-start">
            <PendingAssistantState agentName={bootstrap.agent.name} />
          </article>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/8 px-3.5 py-2.5 text-[13px] text-destructive">
            {error.message}
          </div>
        ) : null}
      </div>

      {/* Chat input area */}
      <div className="border-t border-border/60 bg-card/50 px-4 py-3 lg:px-5">
        <form
          className="flex w-full flex-col gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            void submitPrompt(draft);
          }}
        >
          <div className="rounded-lg border border-border/60 bg-background p-2.5 transition-colors focus-within:border-primary/40">
            <Textarea
              ref={textareaRef}
              className="max-h-40 min-h-[56px] resize-none border-0 bg-transparent px-0 py-0 text-[13px] shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
              placeholder="Ask about planning, analysis, or finance workflows..."
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submitPrompt(draft);
                }
              }}
            />
            <div className="flex items-center justify-between gap-2 pt-1.5">
              <p className="text-[11px] text-muted-foreground/50">
                {isStreaming
                  ? "Generating..."
                  : "Enter to send"}
              </p>
              <div className="flex items-center gap-1.5">
                {isStreaming ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-md px-2.5 text-[11px]"
                    onClick={() => {
                      void stop();
                    }}
                  >
                    <SquareIcon className="size-2.5 fill-current" />
                    Stop
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  size="sm"
                  className="h-7 rounded-md px-3 text-[11px]"
                  disabled={!draft.trim() || isStreaming}
                >
                  {isStreaming ? (
                    <LoaderCircleIcon className="size-3 animate-spin" />
                  ) : (
                    <ArrowUpIcon className="size-3" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({
  agentName,
  isStreaming,
  message,
}: {
  agentName: string;
  isStreaming: boolean;
  message: ChatUIMessage;
}) {
  const activityParts = getActivityParts(message);
  const reasoningText = getReasoningText(message);
  const textParts = getTextParts(message);
  const hasAssistantActivity = message.role === "assistant" && activityParts.length > 0;
  const showReasoningFallback =
    message.role === "assistant" &&
    isStreaming &&
    activityParts.length === 0 &&
    reasoningText.length === 0 &&
    textParts.length === 0;

  if (message.role === "user") {
    return (
      <div className="max-w-[min(640px,80%)] rounded-lg bg-primary px-3.5 py-2.5 text-primary-foreground">
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] opacity-50">
            You
          </p>
          <div className="space-y-1.5 text-[13px] leading-6">
            {textParts.map((part, index) => (
              <p key={`${message.id}-${String(index)}`} className="whitespace-pre-wrap">
                {part}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[min(720px,88%)] flex-col gap-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">
        {agentName}
      </p>

      {hasAssistantActivity ? (
        <AssistantActivityStrip activities={activityParts} isStreaming={isStreaming} />
      ) : null}

      {reasoningText || showReasoningFallback ? (
        <Reasoning
          className="max-w-xl"
          defaultOpen={Boolean(reasoningText)}
          isStreaming={showReasoningFallback}
        >
          <ReasoningTrigger />
          <ReasoningContent>
            {reasoningText || "The assistant is working through the next response."}
          </ReasoningContent>
        </Reasoning>
      ) : null}

      {textParts.length > 0 ? (
        <div className="rounded-lg border border-border/60 bg-card px-3.5 py-2.5 text-card-foreground">
          <div className="space-y-1.5 text-[13px] leading-6">
            {textParts.map((part, index) => (
              <p key={`${message.id}-${String(index)}`} className="whitespace-pre-wrap">
                {part}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AssistantActivityStrip({
  activities,
  isStreaming,
}: {
  activities: ChatActivity[];
  isStreaming: boolean;
}) {
  const activeCount = activities.filter((activity) => activity.status === "active").length;

  return (
    <ChainOfThought className="max-w-xl" defaultOpen={isStreaming}>
      <ChainOfThoughtHeader activeCount={activeCount}>
        {isStreaming ? "Working through your request" : "What the assistant did"}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {activities.map((activity) => (
          <ChainOfThoughtStep
            key={activity.id}
            icon={activity.kind === "tool" ? <ChainOfThoughtToolIcon /> : activity.kind === "status" ? <BrainCogIcon className="size-3.5 text-primary" /> : <WrenchIcon className="size-3.5 text-primary" />}
            status={activity.status}
            title={activity.label}
            {...(activity.detail ? { detail: activity.detail } : {})}
          />
        ))}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

function PendingAssistantState({ agentName }: { agentName: string }) {
  return (
    <div className="flex w-full max-w-[min(720px,88%)] flex-col gap-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">
        {agentName}
      </p>
      <Reasoning className="max-w-xl" isStreaming>
        <ReasoningTrigger />
      </Reasoning>
    </div>
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

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import {
  ArrowUpIcon,
  BotIcon,
  LoaderCircleIcon,
  SparklesIcon,
  SquareIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AuthOverview, ChatBootstrap } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10">
            <LoaderCircleIcon className="size-4 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading chat</p>
        </div>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div className="flex flex-1 flex-col items-start gap-4 px-4 py-6 lg:px-6">
        <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          {errorMessage ?? "Chat is unavailable right now."}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setRefreshToken((current) => current + 1);
            }}
          >
            Retry
          </Button>
          <Button asChild className="rounded-full">
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
  } = useChat({
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
      <div className="flex items-center gap-4 border-b border-border px-4 py-3 lg:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            <BotIcon className="size-3" />
            {bootstrap.agent.name}
          </span>
          {providerName ? (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
              {providerName}
              {bootstrap.resolvedModelId ? ` · ${bootstrap.resolvedModelId}` : ""}
            </span>
          ) : null}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-6 lg:px-6"
      >
        {messages.length === 0 ? (
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 py-10 text-center">
            <div className="space-y-4">
              <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <SparklesIcon className="size-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Start a conversation
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Ask {bootstrap.agent.name} about planning, analysis, and finance decisions.
                </p>
              </div>
            </div>

            {/* Starter prompt cards — solid bg, visible border */}
            <div className="grid w-full gap-3 sm:grid-cols-3">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="group rounded-2xl border border-border bg-card px-4 py-4 text-left text-[13px] leading-relaxed text-card-foreground/80 shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-accent hover:text-card-foreground"
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
              <div
                className={cn(
                  "max-w-[min(720px,82%)] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-card-foreground shadow-sm",
                )}
              >
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60">
                    {message.role === "user" ? "You" : bootstrap.agent.name}
                  </p>
                  <div className="space-y-2 text-[14px] leading-7">
                    {message.parts
                      .filter((part) => part.type === "text")
                      .map((part, index) => (
                        <p
                          key={`${message.id}-${String(index)}`}
                          className="whitespace-pre-wrap"
                        >
                          {part.text}
                        </p>
                      ))}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}

        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}
      </div>

      {/* ── Chat input area ── visible, elevated, distinct from background ── */}
      <div className="border-t border-border bg-card px-4 py-4 lg:px-6">
        <form
          className="flex w-full flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submitPrompt(draft);
          }}
        >
          <div className="rounded-xl border border-border bg-background p-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
            <Textarea
              ref={textareaRef}
              className="max-h-48 min-h-[72px] resize-none border-0 bg-transparent px-0 py-0 text-[14px] shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
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
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-muted-foreground">
                {isStreaming
                  ? "Generating..."
                  : "Enter to send, Shift+Enter for new line"}
              </p>
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => {
                      void stop();
                    }}
                  >
                    <SquareIcon className="size-3 fill-current" />
                    Stop
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 rounded-full px-4"
                  disabled={!draft.trim() || isStreaming}
                >
                  {isStreaming ? (
                    <LoaderCircleIcon className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowUpIcon className="size-3.5" />
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

function toUiMessage(message: ChatBootstrap["messages"][number]): UIMessage {
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

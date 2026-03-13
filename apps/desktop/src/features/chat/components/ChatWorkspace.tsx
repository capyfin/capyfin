import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
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
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircleIcon className="size-4 animate-spin" />
          Loading chat
        </div>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div className="flex flex-1 flex-col items-start gap-4 px-4 py-6 lg:px-6">
        <p className="text-sm text-muted-foreground">
          {errorMessage ?? "Chat is unavailable right now."}
        </p>
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
      new DefaultChatTransport({
        api: client?.createApiUrl("/chat") ?? "/chat",
        ...(client ? { headers: client.createAuthHeaders() } : {}),
        prepareSendMessagesRequest({ messages }) {
          const latestMessage = messages[messages.length - 1];

          return {
            body: {
              agentId: bootstrap.agent.id,
              ...(latestMessage ? { message: latestMessage } : {}),
              sessionId: bootstrap.session.id,
            },
          };
        },
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
      (provider) => provider.provider.id === bootstrap.resolvedProviderId,
    )?.provider.name ?? bootstrap.resolvedProviderId;

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
      <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <BotIcon className="size-3.5" />
              {bootstrap.agent.name}
            </span>
            {providerName ? (
              <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                {providerName}
                {bootstrap.resolvedModelId ? ` · ${bootstrap.resolvedModelId}` : ""}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask the main agent for planning, analysis, and finance execution help.
          </p>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 lg:px-6"
      >
        {messages.length === 0 ? (
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
            <div className="space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <SparklesIcon className="size-6" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  Start a conversation with {bootstrap.agent.name}.
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use the main agent for planning, analysis, and finance decisions.
                </p>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4 text-left text-sm leading-6 text-foreground transition-colors hover:bg-muted"
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
                  "max-w-[min(760px,84%)] rounded-[26px] px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/70 bg-background text-foreground shadow-xs",
                )}
              >
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-70">
                    {message.role === "user" ? "You" : bootstrap.agent.name}
                  </p>
                  <div className="space-y-3 text-[15px] leading-7">
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
          <div className="rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error.message}
          </div>
        ) : null}
      </div>

      <div className="border-t border-border/70 bg-background/55 px-4 py-4 backdrop-blur-sm lg:px-6">
        <form
          className="flex w-full flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submitPrompt(draft);
          }}
        >
          <div className="border border-border/70 bg-background/80 p-3">
            <Textarea
              ref={textareaRef}
              className="max-h-56 min-h-[88px] resize-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
              placeholder="Ask the main agent about planning, analysis, or finance workflows."
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
            <div className="flex items-center justify-between gap-3 pt-3">
              <p className="text-xs text-muted-foreground">
                {isStreaming
                  ? "Generating a response..."
                  : "Press Enter to send, Shift+Enter for a new line."}
              </p>
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      void stop();
                    }}
                  >
                    <SquareIcon className="size-3.5 fill-current" />
                    Stop
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  className="rounded-full px-4"
                  disabled={!draft.trim() || isStreaming}
                >
                  {isStreaming ? (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  ) : (
                    <ArrowUpIcon className="size-4" />
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

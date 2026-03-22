import { Chat, useChat } from "@ai-sdk/react";
import {
  BotIcon,
  BriefcaseIcon,
  CopyIcon,
  FileTextIcon,
  LoaderCircleIcon,
  SparklesIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthOverview, ChatBootstrap } from "@/app/types";
import { formatModelId, getAgentDisplayName, getProviderDisplayName } from "@/features/agents/copy";
import { CHAT_EMPTY_STATE_SUBTITLE, CHAT_INPUT_PLACEHOLDER } from "@/features/chat/chat-placeholder";
import {
  MARKET_STARTER_PROMPTS,
  PORTFOLIO_STARTER_PROMPTS,
} from "@/features/chat/starter-prompts";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  Message,
  MessageActions,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
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
import { deriveSessionLabel } from "@/features/chat/session-label";
import type { PendingCardPrompt } from "@/app/state/app-state";

import { trimChatCache, chatCache, cardPromptLabels } from "@/features/chat/chat-cache";

const suggestionAccent: Record<string, { card: string; hover: string; iconBg: string; iconText: string }> = {
  amber: {
    card: "border-amber-500/15 bg-amber-500/[0.04] dark:bg-amber-500/[0.06]",
    hover: "hover:border-amber-500/30 hover:bg-amber-500/[0.08] dark:hover:bg-amber-500/[0.10]",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-500",
  },
  blue: {
    card: "border-blue-500/15 bg-blue-500/[0.04] dark:bg-blue-500/[0.06]",
    hover: "hover:border-blue-500/30 hover:bg-blue-500/[0.08] dark:hover:bg-blue-500/[0.10]",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-500",
  },
  emerald: {
    card: "border-emerald-500/15 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]",
    hover: "hover:border-emerald-500/30 hover:bg-emerald-500/[0.08] dark:hover:bg-emerald-500/[0.10]",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-500",
  },
  rose: {
    card: "border-rose-500/15 bg-rose-500/[0.04] dark:bg-rose-500/[0.06]",
    hover: "hover:border-rose-500/30 hover:bg-rose-500/[0.08] dark:hover:bg-rose-500/[0.10]",
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-500",
  },
};

interface ChatWorkspaceProps {
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
  hasPortfolio?: boolean | undefined;
  onBootstrap?: ((sessionId: string) => void) | undefined;
  onClearPendingPrompt?: (() => void) | undefined;
  onSessionLabelUpdate?:
    | ((sessionId: string, label: string) => void)
    | undefined;
  pendingCardPrompt?: PendingCardPrompt | null | undefined;
  sessionId?: string | undefined;
}


export function ChatWorkspace({
  authOverview,
  client,
  hasPortfolio = false,
  onBootstrap,
  onClearPendingPrompt,
  onSessionLabelUpdate,
  pendingCardPrompt,
  sessionId,
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
        setErrorMessage(null);
      }

      try {
        const nextBootstrap = await client.chatBootstrap("main", sessionId);
        if (!cancelled) {
          setBootstrap(nextBootstrap);
          onBootstrap?.(nextBootstrap.session.id);
        }
      } catch (error) {
        console.error("Failed to bootstrap chat", error);
        if (!cancelled) {
          setBootstrap(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Chat is unavailable right now.",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, refreshToken, sessionId]);

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
            <a href="#providers">Manage providers</a>
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
      hasPortfolio={hasPortfolio}
      onClearPendingPrompt={onClearPendingPrompt}
      onSessionLabelUpdate={onSessionLabelUpdate}
      pendingCardPrompt={pendingCardPrompt}
    />
  );
}

function ChatSessionView({
  authOverview,
  bootstrap,
  client,
  hasPortfolio,
  onClearPendingPrompt,
  onSessionLabelUpdate,
  pendingCardPrompt,
}: {
  authOverview: AuthOverview | null;
  bootstrap: ChatBootstrap;
  client: SidecarClient | null;
  hasPortfolio?: boolean | undefined;
  onClearPendingPrompt?: (() => void) | undefined;
  onSessionLabelUpdate?:
    | ((sessionId: string, label: string) => void)
    | undefined;
  pendingCardPrompt?: PendingCardPrompt | null | undefined;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const hasCustomLabelRef = useRef(bootstrap.messages.length > 0);
  const didMountRef = useRef(false);

  // Re-use existing Chat instance if one exists (preserves streaming state)
  const chat = useMemo(() => {
    const existing = chatCache.get(bootstrap.session.id);
    if (existing) {
      return existing;
    }
    const transport = createChatTransport({
      agentId: bootstrap.agent.id,
      client,
      sessionId: bootstrap.session.id,
    });
    const instance = new Chat<ChatUIMessage>({
      dataPartSchemas: chatDataPartSchemas,
      id: bootstrap.session.id,
      messages: bootstrap.messages.map(toUiMessage),
      transport,
    });
    chatCache.set(bootstrap.session.id, instance);
    trimChatCache();
    return instance;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrap.session.id]);

  const { error, messages, sendMessage, status, stop } = useChat<ChatUIMessage>(
    { chat },
  );

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    list.scrollTo({
      behavior: didMountRef.current ? "smooth" : "instant",
      top: list.scrollHeight,
    });
    didMountRef.current = true;
  }, [messages, status]);

  // Auto-send pending card prompt when this session was initiated from a card click
  const pendingSentRef = useRef(false);
  useEffect(() => {
    if (
      pendingCardPrompt?.sessionId === bootstrap.session.id &&
      !pendingSentRef.current
    ) {
      pendingSentRef.current = true;
      cardPromptLabels.set(bootstrap.session.id, pendingCardPrompt.displayLabel);
      hasCustomLabelRef.current = true;
      void sendMessage({ text: pendingCardPrompt.prompt });
      onClearPendingPrompt?.();
    }
  }, [
    pendingCardPrompt,
    bootstrap.session.id,
    sendMessage,
    onClearPendingPrompt,
  ]);

  const isStreaming = status === "streaming" || status === "submitted";
  const latestMessage = messages[messages.length - 1];
  const starterPrompts = hasPortfolio
    ? PORTFOLIO_STARTER_PROMPTS
    : MARKET_STARTER_PROMPTS;
  const providerName = bootstrap.resolvedProviderId
    ? getProviderDisplayName(
        bootstrap.resolvedProviderId,
        authOverview?.providers,
      )
    : undefined;

  const handleSubmit = useCallback(
    (prompt: { text: string; files?: import("ai").FileUIPart[] }) => {
      const text = prompt.text.trim();
      if (!text) {
        return;
      }
      // Fire-and-forget so PromptInput clears attachments immediately
      void sendMessage({
        text,
        ...(prompt.files?.length ? { files: prompt.files } : {}),
      });

      if (!hasCustomLabelRef.current && client) {
        hasCustomLabelRef.current = true;
        const label = deriveSessionLabel(text);
        void client
          .updateSessionLabel(bootstrap.session.id, label)
          .then(() => {
            onSessionLabelUpdate?.(bootstrap.session.id, label);
          })
          .catch(() => {
            // Silently ignore — label is cosmetic
          });
      }
    },
    [bootstrap.session.id, client, onSessionLabelUpdate, sendMessage],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Agent/provider bar */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 lg:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <BotIcon className="size-3" />
            {getAgentDisplayName(bootstrap.agent.name)}
          </span>
          {providerName ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {providerName}
              {bootstrap.resolvedModelId
                ? ` / ${formatModelId(bootstrap.resolvedModelId)}`
                : ""}
            </span>
          ) : null}
          {hasPortfolio ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              <BriefcaseIcon className="size-3" />
              Portfolio
            </span>
          ) : null}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 lg:px-6"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
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
                  {CHAT_EMPTY_STATE_SUBTITLE}
                </p>
              </div>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-3">
              {starterPrompts.map((prompt) => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- fallback guaranteed
                const accent = (suggestionAccent[prompt.color] ?? suggestionAccent.amber)!;
                return (
                  <button
                    key={prompt.text}
                    type="button"
                    className={`flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left text-sm font-medium leading-relaxed transition-all duration-150 ${accent.card} ${accent.hover}`}
                    onClick={() => {
                      handleSubmit({ text: prompt.text });
                    }}
                  >
                    <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${accent.iconBg}`}>
                      <prompt.icon className={`size-4 ${accent.iconText}`} />
                    </div>
                    <span className="text-muted-foreground">{prompt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              displayLabel={
                index === 0 && message.role === "user"
                  ? cardPromptLabels.get(bootstrap.session.id)
                  : undefined
              }
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
      </div>

      {/* Chat input */}
      <div className="border-t border-border/60 px-4 py-3 lg:px-6">
        <PromptInput
          accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.hpp,.cs,.swift,.kt,.sh,.bash,.zsh,.yaml,.yml,.toml,.xml,.html,.css,.scss,.sql,.r,.lua,.php,.pl,.ex,.exs,.hs,.ml,.scala,.clj,.dart,.vue,.svelte,.astro,.log,.env,.ini,.cfg,.conf,.diff,.patch"
          globalDrop
          multiple
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl"
        >
          <PromptInputHeader>
            <AttachmentPreviews />
          </PromptInputHeader>
          <PromptInputTextarea
            placeholder={CHAT_INPUT_PLACEHOLDER}
          />
          <PromptInputFooter>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent className="!w-auto">
                <PromptInputActionAddAttachments label="Add files or images" />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <PromptInputSubmit
              status={status}
              onStop={() => {
                void stop();
              }}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>

      {/* Financial disclaimer */}
      {messages.length > 0 ? (
        <div className="px-4 py-1.5 lg:px-6">
          <p className="mx-auto max-w-3xl text-center text-[11px] leading-tight text-muted-foreground/60">
            Not financial advice. AI-generated analysis may contain errors.
            Always verify data and consult a qualified advisor before making
            investment decisions.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function AttachmentPreviews() {
  const { files, remove } = usePromptInputAttachments();

  if (files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="grid">
      {files.map((file) => (
        <Attachment
          data={file}
          key={file.id}
          onRemove={() => {
            remove(file.id);
          }}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

function getFileParts(message: ChatUIMessage) {
  return message.parts.filter(
    (part): part is import("ai").FileUIPart & { type: "file" } =>
      part.type === "file",
  );
}

function ChatMessage({
  displayLabel,
  isStreaming,
  message,
}: {
  displayLabel?: string | undefined;
  isStreaming: boolean;
  message: ChatUIMessage;
}) {
  const activityParts = getActivityParts(message);
  const reasoningText = getReasoningText(message);
  const textParts = getTextParts(message);
  const fileParts = getFileParts(message);
  const fullText = textParts.join("\n\n");
  const isThinking =
    message.role === "assistant" &&
    isStreaming &&
    activityParts.some((activity) => activity.status === "active");

  if (message.role === "user") {
    const imageParts = fileParts.filter((f) =>
      f.mediaType.startsWith("image/"),
    );
    const docParts = fileParts.filter((f) => !f.mediaType.startsWith("image/"));

    // Card-initiated messages show the display label instead of the raw prompt
    if (displayLabel) {
      return (
        <Message from="user">
          <MessageContent>
            <p className="font-medium text-foreground">{displayLabel}</p>
          </MessageContent>
        </Message>
      );
    }

    return (
      <Message from="user">
        {imageParts.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-2">
            {imageParts.map((file, index) => (
              <img
                key={`${message.id}-img-${String(index)}`}
                alt={file.filename ?? "Attached image"}
                className="max-h-48 max-w-xs rounded-lg object-cover"
                src={file.url}
              />
            ))}
          </div>
        ) : null}
        {docParts.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-2">
            {docParts.map((file, index) => (
              <div
                key={`${message.id}-doc-${String(index)}`}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
              >
                <FileTextIcon className="size-4 shrink-0" />
                <span className="truncate">{file.filename ?? "File"}</span>
              </div>
            ))}
          </div>
        ) : null}
        <MessageContent>
          {textParts.map((part, index) => (
            <p
              key={`${message.id}-${String(index)}`}
              className="whitespace-pre-wrap"
            >
              {part}
            </p>
          ))}
        </MessageContent>
        {fullText ? (
          <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
            <CopyAction text={fullText} />
          </div>
        ) : null}
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
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            onClick={() => {
              void navigator.clipboard.writeText(text);
              setCopied(true);
              window.setTimeout(() => {
                setCopied(false);
              }, 1500);
            }}
          >
            <CopyIcon className="size-3.5" />
            <span className="sr-only">Copy</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="px-2 py-1 text-xs">
          {copied ? "Copied!" : "Copy"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function toUiMessage(
  message: ChatBootstrap["messages"][number],
): ChatUIMessage {
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

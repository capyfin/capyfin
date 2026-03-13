import { startTransition, useEffect, useMemo, useState } from "react";
import { BotIcon, PlusIcon, RefreshCcwIcon, SparklesIcon } from "lucide-react";
import type { Agent, AuthOverview } from "@/app/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SidecarClient } from "@/lib/sidecar/client";

interface AgentsWorkspaceProps {
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
}

interface CreateAgentDraft {
  modelId: string;
  name: string;
  providerId: string;
}

const EMPTY_DRAFT: CreateAgentDraft = {
  modelId: "",
  name: "",
  providerId: "",
};

export function AgentsWorkspace({
  authOverview,
  client,
}: AgentsWorkspaceProps) {
  const connectedProviders = useMemo(
    () =>
      (authOverview?.providers ?? []).filter(
        (provider) =>
          provider.profiles.length > 0 || provider.environment.available,
      ),
    [authOverview],
  );
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<CreateAgentDraft>(EMPTY_DRAFT);

  useEffect(() => {
    const nextProviderId =
      authOverview?.selectedProviderId ?? connectedProviders[0]?.provider.id ?? "";

    setDraft((current) =>
      current.providerId
        ? current
        : {
            ...current,
            providerId: nextProviderId,
          },
    );
  }, [authOverview?.selectedProviderId, connectedProviders]);

  useEffect(() => {
    let cancelled = false;

    async function loadAgents(): Promise<void> {
      if (!client) {
        if (!cancelled) {
          setAgents([]);
          setIsLoading(false);
          setErrorMessage("Agents are temporarily unavailable.");
        }
        return;
      }

      if (!cancelled) {
        setIsLoading(true);
        setErrorMessage(null);
      }

      try {
        const catalog = await client.agents();
        if (!cancelled) {
          setAgents(catalog.agents);
        }
      } catch (error) {
        if (!cancelled) {
          setAgents([]);
          setErrorMessage("Agents are temporarily unavailable.");
        }
        console.error("Failed to load agents", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAgents();

    return () => {
      cancelled = true;
    };
  }, [client]);

  const selectedProviderName =
    connectedProviders.find((provider) => provider.provider.id === draft.providerId)
      ?.provider.name ?? "selected provider";
  const canCreate =
    Boolean(client) &&
    Boolean(draft.name.trim()) &&
    Boolean(draft.providerId.trim());

  async function refreshAgents(): Promise<void> {
    if (!client) {
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const catalog = await client.agents();
      setAgents(catalog.agents);
    } catch (error) {
      setErrorMessage("Agents are temporarily unavailable.");
      console.error("Failed to refresh agents", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateAgent(): Promise<void> {
    if (!client || !canCreate) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFeedback(null);

    try {
      const createdAgent = await client.createAgent({
        name: draft.name.trim(),
        providerId: draft.providerId.trim(),
        ...(draft.modelId.trim() ? { modelId: draft.modelId.trim() } : {}),
      });

      startTransition(() => {
        setAgents((current) => [...current, createdAgent]);
        setDraft({
          ...EMPTY_DRAFT,
          providerId: draft.providerId,
        });
        setIsCreateOpen(false);
      });
      setFeedback(`Created ${createdAgent.name}.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not create agent.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between lg:p-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Agents
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Create the agents that will run CapyFin workflows.
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Keep this simple: each agent gets a name, a provider, and an optional
            model. Everything else can evolve later.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              void refreshAgents();
            }}
          >
            <RefreshCcwIcon className="size-4" />
            Refresh
          </Button>
          <Button
            className="rounded-full px-4"
            onClick={() => {
              setFeedback(null);
              setErrorMessage(null);
              setIsCreateOpen((current) => !current);
            }}
          >
            <PlusIcon className="size-4" />
            {isCreateOpen ? "Close" : "New agent"}
          </Button>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {feedback}
        </div>
      ) : null}

      {isCreateOpen ? (
        <Card className="rounded-[28px] border border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="gap-2">
            <CardTitle>Create agent</CardTitle>
            <CardDescription>
              Start with the minimum configuration. CapyFin will generate the
              initial instructions for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-foreground">Agent name</span>
              <Input
                placeholder="Research"
                value={draft.name}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setDraft((current) => ({ ...current, name: nextValue }));
                }}
              />
            </label>

            <div className="grid gap-2 text-sm">
              <span className="font-medium text-foreground">Provider</span>
              <div className="flex flex-wrap gap-2">
                {connectedProviders.map((provider) => {
                  const isSelected = provider.provider.id === draft.providerId;

                  return (
                    <button
                      key={provider.provider.id}
                      type="button"
                      className={cn(
                        "rounded-full border px-3 py-2 text-sm transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      )}
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          providerId: provider.provider.id,
                        }));
                      }}
                    >
                      {provider.provider.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="grid gap-2 text-sm lg:col-span-2">
              <span className="font-medium text-foreground">Model</span>
              <Input
                placeholder={`Optional, for example ${exampleModelForProvider(draft.providerId)}`}
                value={draft.modelId}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setDraft((current) => ({ ...current, modelId: nextValue }));
                }}
              />
            </label>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 border-t bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              New agent will use {selectedProviderName}.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setIsCreateOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full px-4"
                disabled={!canCreate || isSubmitting}
                onClick={() => {
                  void handleCreateAgent();
                }}
              >
                {isSubmitting ? (
                  <>
                    <SparklesIcon className="size-4 animate-pulse" />
                    Creating
                  </>
                ) : (
                  <>
                    <PlusIcon className="size-4" />
                    Create agent
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : null}

      <section className="rounded-[28px] border border-border/70 bg-card/90 shadow-sm">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:px-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Agent library
            </h2>
            <p className="text-sm text-muted-foreground">
              {agents.length === 0
                ? "No custom agents yet."
                : `${String(agents.length)} agents available.`}
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col">
          {isLoading ? (
            <div className="px-5 py-8 text-sm text-muted-foreground lg:px-6">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="px-5 py-10 lg:px-6">
              <div className="flex max-w-md flex-col gap-2 rounded-3xl border border-dashed border-border/80 bg-muted/20 p-6">
                <BotIcon className="size-5 text-muted-foreground" />
                <h3 className="text-base font-medium text-foreground">
                  No agents yet
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Create your first agent to start defining reusable finance
                  workflows.
                </p>
                <div>
                  <Button
                    className="mt-2 rounded-full px-4"
                    onClick={() => {
                      setIsCreateOpen(true);
                    }}
                  >
                    <PlusIcon className="size-4" />
                    New agent
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            agents.map((agent, index) => (
              <article
                key={agent.id}
                className={cn(
                  "grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_auto] lg:items-center lg:px-6",
                  index !== 0 && "border-t border-border/60",
                )}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium text-foreground">
                      {agent.name}
                    </h3>
                    {agent.isDefault ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {agent.description ??
                      "Ready for finance planning, research, and execution support."}
                  </p>
                </div>

                <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em]">
                      Provider
                    </dt>
                    <dd className="mt-1 text-foreground">
                      {providerLabel(agent.providerId, authOverview)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em]">Model</dt>
                    <dd className="mt-1 text-foreground">
                      {agent.modelId ?? "Provider default"}
                    </dd>
                  </div>
                </dl>

                <div className="text-sm text-muted-foreground">
                  {formatTimestamp(agent.updatedAt)}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function exampleModelForProvider(providerId: string): string {
  switch (providerId) {
    case "openai":
      return "gpt-5";
    case "anthropic":
      return "claude-sonnet-4";
    case "google":
      return "gemini-2.5-pro";
    default:
      return "provider default";
  }
}

function providerLabel(
  providerId: string | undefined,
  authOverview: AuthOverview | null,
): string {
  if (!providerId) {
    return "Provider not set";
  }

  return (
    authOverview?.providers.find((provider) => provider.provider.id === providerId)
      ?.provider.name ?? providerId
  );
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

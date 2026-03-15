import { startTransition, useEffect, useMemo, useState } from "react";
import { BotIcon, LoaderCircleIcon, PlusIcon, RefreshCcwIcon, SparklesIcon } from "lucide-react";
import type { Agent, AuthOverview, ProviderModelCatalog } from "@/app/types";
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
  createRequestToken: number;
}

interface CreateAgentDraft {
  modelId: string;
  name: string;
  providerId: string;
}

interface ConnectedProviderOption {
  providerId: string;
  providerName: string;
}

const EMPTY_DRAFT: CreateAgentDraft = {
  modelId: "",
  name: "",
  providerId: "",
};

export function AgentsWorkspace({
  authOverview,
  client,
  createRequestToken,
}: AgentsWorkspaceProps) {
  const connectedProviders = useMemo(
    () => {
      const uniqueProviders = new Map<string, ConnectedProviderOption>();

      for (const connection of authOverview?.connections ?? []) {
        if (!uniqueProviders.has(connection.providerId)) {
          uniqueProviders.set(connection.providerId, {
            providerId: connection.providerId,
            providerName: connection.providerName,
          });
        }
      }

      return [...uniqueProviders.values()];
    },
    [authOverview],
  );
  const [agents, setAgents] = useState<Agent[]>([]);
  const [modelCatalogs, setModelCatalogs] = useState<Record<string, ProviderModelCatalog>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyAgentId, setBusyAgentId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreateAgentDraft>(EMPTY_DRAFT);

  useEffect(() => {
    const nextProviderId =
      authOverview?.selectedProviderId ?? connectedProviders[0]?.providerId ?? "";

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
    if (!client || connectedProviders.length === 0) {
      setModelCatalogs({});
      return;
    }

    let cancelled = false;
    const runtimeClient = client;

    async function loadModelCatalogs(): Promise<void> {
      const entries = await Promise.all(
        connectedProviders.map(async (provider) => [
          provider.providerId,
          await runtimeClient.providerModels(provider.providerId),
        ] as const),
      );

      if (!cancelled) {
        setModelCatalogs(Object.fromEntries(entries));
      }
    }

    void loadModelCatalogs().catch((error: unknown) => {
      if (!cancelled) {
        setErrorMessage(getErrorMessage(error));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [client, connectedProviders]);

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

  useEffect(() => {
    if (createRequestToken === 0) {
      return;
    }

    setFeedback(null);
    setErrorMessage(null);
    setIsCreateOpen(true);
  }, [createRequestToken]);

  const selectedProviderName =
    connectedProviders.find((provider) => provider.providerId === draft.providerId)
      ?.providerName ?? "selected provider";
  const selectedProviderCatalog = draft.providerId ? modelCatalogs[draft.providerId] : undefined;
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

  async function handleUpdateAgentProvider(
    agentId: string,
    nextProviderId: string,
  ): Promise<void> {
    if (!client) {
      return;
    }

    setBusyAgentId(agentId);
    setErrorMessage(null);
    setFeedback(null);

    try {
      const updatedAgent = await client.updateAgent(agentId, {
        modelId: "",
        providerId: nextProviderId,
      });

      setAgents((current) =>
        current.map((agent) => (agent.id === agentId ? updatedAgent : agent)),
      );
      setFeedback(`Updated ${updatedAgent.name}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyAgentId(null);
    }
  }

  async function handleUpdateAgentModel(
    agentId: string,
    providerId: string,
    nextModelId: string,
  ): Promise<void> {
    if (!client) {
      return;
    }

    setBusyAgentId(agentId);
    setErrorMessage(null);
    setFeedback(null);

    try {
      const updatedAgent = await client.updateAgent(agentId, {
        modelId: nextModelId,
        providerId,
      });

      setAgents((current) =>
        current.map((agent) => (agent.id === agentId ? updatedAgent : agent)),
      );
      setFeedback(`Updated ${updatedAgent.name}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyAgentId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5">
      {errorMessage ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          {errorMessage}
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {feedback}
        </div>
      ) : null}

      {isCreateOpen ? (
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Create agent</CardTitle>
            <CardDescription className="text-[13px]">
              Start with the minimum configuration. CapyFin will generate the
              initial instructions for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-medium text-foreground">Agent name</span>
              <Input
                placeholder="Research"
                value={draft.name}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setDraft((current) => ({ ...current, name: nextValue }));
                }}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-xs font-medium text-foreground">Provider</span>
              <select
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                value={draft.providerId}
                onChange={(event) => {
                  const nextProviderId = event.target.value;
                  setDraft((current) => ({
                    ...current,
                    modelId: "",
                    providerId: nextProviderId,
                  }));
                }}
              >
                <option value="">Select provider</option>
                {connectedProviders.map((provider) => (
                  <option key={provider.providerId} value={provider.providerId}>
                    {provider.providerName}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-xs font-medium text-foreground">Model</span>
              <select
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!draft.providerId}
                value={draft.modelId}
                onChange={(event) => {
                  const nextModelId = event.target.value;
                  setDraft((current) => ({ ...current, modelId: nextModelId }));
                }}
              >
                <option value="">Provider default</option>
                {selectedProviderCatalog?.models.map((model) => (
                  <option key={model.modelRef} value={model.modelId}>
                    {model.label}
                  </option>
                ))}
              </select>
            </label>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 border-t border-border bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-muted-foreground">
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

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:px-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Agent library
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {agents.length === 0
                ? "No custom agents yet."
                : `${String(agents.length)} agents available.`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              void refreshAgents();
            }}
          >
            <RefreshCcwIcon className="size-3.5" />
            Refresh
          </Button>
        </div>
        <Separator />
        <div className="flex flex-col">
          {isLoading ? (
            <div className="px-5 py-10 lg:px-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <LoaderCircleIcon className="size-4 animate-spin" />
                Loading agents...
              </div>
            </div>
          ) : agents.length === 0 ? (
            <div className="px-5 py-10 lg:px-6">
              <div className="flex max-w-md flex-col gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-6">
                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                  <BotIcon className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    No agents yet
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    Create your first agent to start defining reusable finance
                    workflows. Use Create Agent in the header to get started.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            agents.map((agent, index) => (
              <article
                key={agent.id}
                className={cn(
                  "grid gap-3 px-5 py-4 transition-colors hover:bg-muted/30 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_auto] lg:items-center lg:px-6",
                  index !== 0 && "border-t border-border",
                )}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">
                      {agent.name}
                    </h3>
                    {agent.isDefault ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {agent.description ??
                      "Ready for finance planning, research, and execution support."}
                  </p>
                </div>

                <div className="grid gap-3 text-[13px] text-muted-foreground sm:grid-cols-2 lg:grid-cols-1">
                  <label className="grid gap-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
                      Provider
                    </span>
                    <select
                      className="h-9 rounded-xl border border-border bg-background px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={busyAgentId === agent.id || connectedProviders.length === 0}
                      value={agent.providerId ?? ""}
                      onChange={(event) => {
                        void handleUpdateAgentProvider(agent.id, event.target.value);
                      }}
                    >
                      <option value="">Select provider</option>
                      {connectedProviders.map((provider) => (
                        <option key={provider.providerId} value={provider.providerId}>
                          {provider.providerName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
                      Model
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        className="h-9 w-full rounded-xl border border-border bg-background px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={
                          busyAgentId === agent.id ||
                          !agent.providerId ||
                          !modelCatalogs[agent.providerId]
                        }
                        value={agent.modelId ?? ""}
                        onChange={(event) => {
                          if (!agent.providerId) {
                            return;
                          }

                          void handleUpdateAgentModel(
                            agent.id,
                            agent.providerId,
                            event.target.value,
                          );
                        }}
                      >
                        <option value="">Provider default</option>
                        {agent.providerId
                          ? modelCatalogs[agent.providerId]?.models.map((model) => (
                              <option key={model.modelRef} value={model.modelId}>
                                {model.label}
                              </option>
                            ))
                          : null}
                      </select>
                      {busyAgentId === agent.id ? (
                        <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
                      ) : null}
                    </div>
                  </label>
                </div>

                <div className="text-[13px] text-muted-foreground">
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

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

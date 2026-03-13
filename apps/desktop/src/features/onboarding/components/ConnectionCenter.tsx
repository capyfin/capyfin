import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  Link2Icon,
  LoaderCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { openExternalUrl } from "@/lib/platform/open-external-url";
import type { AuthOverview, OAuthSession, ProviderStatus } from "@/app/types";
import { SidecarClient } from "@/lib/sidecar/client";

interface ConnectionCenterProps {
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
  isLoading: boolean;
  runtimeError: string | null;
  onAuthOverviewChange: (nextOverview: AuthOverview) => void;
  onContinue: () => void;
}

type InteractiveMethod = "api_key" | "oauth" | "token";
type ConnectionMode =
  | InteractiveMethod
  | "application_default"
  | "aws_sdk";

export function ConnectionCenter({
  authOverview,
  client,
  isLoading,
  runtimeError,
  onAuthOverviewChange,
  onContinue,
}: ConnectionCenterProps) {
  const providers = authOverview?.providers;
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null,
  );
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("oauth");
  const [profileLabel, setProfileLabel] = useState("default");
  const [secret, setSecret] = useState("");
  const [oauthSession, setOAuthSession] = useState<OAuthSession | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const openedLinksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!providers || providers.length === 0) {
      setSelectedProviderId(null);
      return;
    }

    const firstProvider = providers[0];
    if (!firstProvider) {
      return;
    }

    if (
      !selectedProviderId ||
      !providers.some((provider) => provider.provider.id === selectedProviderId)
    ) {
      const preferredProviderId =
        authOverview.selectedProviderId ?? firstProvider.provider.id;
      setSelectedProviderId(preferredProviderId);
    }
  }, [authOverview?.selectedProviderId, providers, selectedProviderId]);

  const selectedProvider =
    providers?.find((provider) => provider.provider.id === selectedProviderId) ??
    providers?.[0] ??
    null;

  useEffect(() => {
    if (!selectedProvider) {
      return;
    }

    if (!selectedProvider.provider.authMethods.includes(connectionMode)) {
      setConnectionMode(resolveDefaultConnectionMode(selectedProvider));
    }
  }, [connectionMode, selectedProvider]);

  useEffect(() => {
    if (!client || oauthSession?.state !== "pending") {
      return;
    }

    let cancelled = false;

    const syncSession = async (): Promise<void> => {
      try {
        const nextSession = await client.getOAuthSession(oauthSession.id);
        if (cancelled) {
          return;
        }

        setOAuthSession(nextSession);
        if (nextSession.step.type === "auth_link") {
          void openSessionLink(nextSession.step.url, openedLinksRef.current);
        }

        if (nextSession.state === "completed") {
          setFeedback(`Connected ${nextSession.providerName}.`);
          setPromptValue("");
          const nextOverview = await client.authOverview();
          onAuthOverviewChange(nextOverview);
        }

        if (nextSession.state === "error") {
          setErrorMessage(nextSession.error ?? renderOAuthSessionMessage(nextSession));
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error));
        }
      }
    };

    void syncSession();
    const timer = window.setInterval(() => {
      void syncSession();
    }, 1_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [client, oauthSession, onAuthOverviewChange]);

  const connectedProviderCount = (providers ?? []).filter(
    (provider) =>
      provider.profiles.length > 0 || provider.environment.available,
  ).length;
  const canContinue = Boolean(authOverview?.selectedProviderId);
  const oauthLinkUrl =
    oauthSession?.step.type === "auth_link" ? oauthSession.step.url : null;

  async function refreshOverview(): Promise<void> {
    if (!client) {
      return;
    }

    const nextOverview = await client.authOverview();
    onAuthOverviewChange(nextOverview);
  }

  async function handleSecretConnect(): Promise<void> {
    if (!client || !selectedProvider) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      await client.connectProviderSecret({
        label: profileLabel.trim() || "default",
        providerId: selectedProvider.provider.id,
        secret: secret.trim(),
      });
      await refreshOverview();
      setSecret("");
      setFeedback(`Connected ${selectedProvider.provider.name}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleEnvironmentSelection(): Promise<void> {
    if (!client || !selectedProvider) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      await client.selectProvider(selectedProvider.provider.id);
      await refreshOverview();
      setFeedback(`Selected ${selectedProvider.provider.name}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleOAuthStart(): Promise<void> {
    if (!client || !selectedProvider) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      const session = await client.startOAuthSession({
        label: profileLabel.trim() || "default",
        providerId: selectedProvider.provider.id,
      });
      setOAuthSession(session);

      if (session.step.type === "auth_link") {
        await openSessionLink(session.step.url, openedLinksRef.current);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleOAuthPromptSubmit(): Promise<void> {
    if (!client || oauthSession?.step.type !== "prompt") {
      return;
    }

    const promptSession = oauthSession;

    setErrorMessage(null);
    setIsBusy(true);

    try {
      const nextSession = await client.submitOAuthSessionPrompt(
        promptSession.id,
        promptValue,
      );
      setOAuthSession(nextSession);
      setPromptValue("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.95fr)]">
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
          <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.85fr)] lg:p-7">
            <div className="space-y-4">
              <Badge className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em]">
                Provider onboarding
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  Connect your model providers before the workspace opens.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  CapyFin keeps provider authentication behind the sidecar.
                  Connect by API key, token, or single sign-on, then set the
                  provider the app should use by default.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill
                  icon={ShieldCheckIcon}
                  label={`${String(connectedProviderCount)} providers ready`}
                />
                <StatusPill
                  icon={SparklesIcon}
                  label={`${authOverview?.selectedProviderId ?? "No"} default provider`}
                />
                <StatusPill
                  icon={KeyRoundIcon}
                  label={
                    authOverview
                      ? authOverview.storePath
                      : "Waiting for local auth store"
                  }
                />
              </div>
            </div>
            <div className="grid gap-3 rounded-3xl border border-border/70 bg-background/75 p-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                  Step 1
                </p>
                <p className="mt-2 font-medium text-foreground">
                  Choose a provider
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/85 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Step 2
                </p>
                <p className="mt-2 font-medium text-foreground">
                  Authenticate with API key, token, or SSO
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/85 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Step 3
                </p>
                <p className="mt-2 font-medium text-foreground">
                  Continue into the workspace
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }, (_, index) => (
                <Card
                  key={String(index)}
                  className="min-h-44 animate-pulse border-border/60 bg-card/75"
                />
              ))
            : (providers ?? []).map((provider) => (
                <button
                  key={provider.provider.id}
                  type="button"
                  onClick={() => {
                    setSelectedProviderId(provider.provider.id);
                    setOAuthSession(null);
                    setErrorMessage(null);
                    setFeedback(null);
                  }}
                  className="text-left"
                >
                  <Card
                    className={cn(
                      "h-full border-border/70 bg-card/90 transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg",
                      selectedProvider?.provider.id === provider.provider.id
                        ? "border-primary/60 shadow-lg shadow-primary/8"
                        : "",
                    )}
                  >
                    <CardHeader className="gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">
                            {provider.provider.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {provider.provider.id}
                          </CardDescription>
                        </div>
                        {provider.isSelectedProvider ? (
                          <Badge className="rounded-full bg-emerald-600/90 text-white">
                            Selected
                          </Badge>
                        ) : provider.profiles.length > 0 ? (
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-emerald-500/10 text-emerald-700"
                          >
                            Connected
                          </Badge>
                        ) : provider.environment.available ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-amber-500/30 text-amber-700"
                          >
                            Environment
                          </Badge>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {provider.provider.authMethods.map((method) => (
                          <Badge
                            key={method}
                            variant="outline"
                            className="rounded-full border-border/70 bg-background/70 px-2.5 py-0.5 text-[11px]"
                          >
                            {renderMethodLabel(method)}
                          </Badge>
                        ))}
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                          {provider.resolved
                            ? provider.resolved.description
                            : "No active connection yet."}
                        </p>
                        <p>
                          {provider.environment.available
                            ? provider.environment.sourceLabel ??
                              "Local environment credentials are available."
                            : "No environment credentials detected."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
        </div>
      </div>

      <Card className="h-fit border-border/70 bg-card/92 shadow-sm xl:sticky xl:top-24">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">
                {selectedProvider?.provider.name ?? "Connection detail"}
              </CardTitle>
              <CardDescription>
                {selectedProvider
                  ? "Choose how CapyFin should authenticate with this provider."
                  : "Select a provider from the list to continue."}
              </CardDescription>
            </div>
            {selectedProvider?.selectedProfileId ? (
              <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">
                {selectedProvider.selectedProfileId}
              </Badge>
            ) : null}
          </div>

          {selectedProvider ? (
            <ToggleGroup
              type="single"
              value={connectionMode}
              onValueChange={(value) => {
                if (value) {
                  setConnectionMode(value as ConnectionMode);
                  setOAuthSession(null);
                  setErrorMessage(null);
                  setFeedback(null);
                }
              }}
              variant="outline"
              spacing={2}
            >
              {selectedProvider.provider.authMethods.map((method) => (
                <ToggleGroupItem key={method} value={method}>
                  {renderMethodLabel(method)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-5">
          {!selectedProvider ? (
            <EmptyDetailState runtimeError={runtimeError} />
          ) : (
            <>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Link2Icon className="size-4 text-primary" />
                  Connection status
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {selectedProvider.resolved
                    ? selectedProvider.resolved.description
                    : "No provider has been selected yet."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="rounded-full">
                    {selectedProvider.profiles.length > 0
                      ? `${String(selectedProvider.profiles.length)} stored profiles`
                      : "No stored profiles"}
                  </Badge>
                  {selectedProvider.environment.available ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-amber-500/30 text-amber-700"
                    >
                      Environment available
                    </Badge>
                  ) : null}
                </div>
              </div>

              {(connectionMode === "api_key" || connectionMode === "token") && (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Store a {connectionMode === "token" ? "token" : "secret key"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      The credential is stored in the local auth profile store
                      and selected immediately after save.
                    </p>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Profile label
                    </span>
                    <Input
                      value={profileLabel}
                      onChange={(event) => {
                        setProfileLabel(event.target.value);
                      }}
                      placeholder="default"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {connectionMode === "token" ? "Token" : "API key"}
                    </span>
                    <Input
                      value={secret}
                      onChange={(event) => {
                        setSecret(event.target.value);
                      }}
                      placeholder={
                        connectionMode === "token"
                          ? "Paste provider token"
                          : "Paste provider API key"
                      }
                      type="password"
                    />
                  </label>

                  <Button
                    className="w-full justify-between rounded-full"
                    disabled={!client || !secret.trim() || isBusy}
                    onClick={() => {
                      void handleSecretConnect();
                    }}
                  >
                    Save connection
                    {isBusy ? (
                      <LoaderCircleIcon className="size-4 animate-spin" />
                    ) : (
                      <ArrowRightIcon className="size-4" />
                    )}
                  </Button>
                </div>
              )}

              {connectionMode === "oauth" && (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Continue with single sign-on
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CapyFin opens the provider sign-in page in your default
                      browser, then guides you through any follow-up steps here.
                    </p>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Profile label
                    </span>
                    <Input
                      value={profileLabel}
                      onChange={(event) => {
                        setProfileLabel(event.target.value);
                      }}
                      placeholder="default"
                    />
                  </label>

                  <Button
                    className="w-full justify-between rounded-full"
                    disabled={!client || isBusy}
                    onClick={() => {
                      void handleOAuthStart();
                    }}
                  >
                    Start sign-in
                    {isBusy ? (
                      <LoaderCircleIcon className="size-4 animate-spin" />
                    ) : (
                      <ExternalLinkIcon className="size-4" />
                    )}
                  </Button>

                  {oauthSession ? (
                    <div className="space-y-3 rounded-2xl border border-primary/18 bg-primary/5 p-4">
                      <p className="text-sm font-medium text-foreground">
                        {oauthSession.providerName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {renderOAuthSessionMessage(oauthSession)}
                      </p>

                      {oauthLinkUrl ? (
                        <Button
                          variant="outline"
                          className="w-full justify-between rounded-full"
                          onClick={() => {
                            void openSessionLink(
                              oauthLinkUrl,
                              openedLinksRef.current,
                              true,
                            );
                          }}
                        >
                          Open sign-in link again
                          <ExternalLinkIcon className="size-4" />
                        </Button>
                      ) : null}

                      {oauthSession.step.type === "prompt" ? (
                        <div className="space-y-3">
                          <Input
                            value={promptValue}
                            onChange={(event) => {
                              setPromptValue(event.target.value);
                            }}
                            placeholder={
                              oauthSession.step.placeholder ??
                              "Enter the requested value"
                            }
                          />
                          <Button
                            className="w-full justify-between rounded-full"
                            disabled={
                              isBusy ||
                              (!oauthSession.step.allowEmpty &&
                                promptValue.trim().length === 0)
                            }
                            onClick={() => {
                              void handleOAuthPromptSubmit();
                            }}
                          >
                            Continue sign-in
                            {isBusy ? (
                              <LoaderCircleIcon className="size-4 animate-spin" />
                            ) : (
                              <ArrowRightIcon className="size-4" />
                            )}
                          </Button>
                        </div>
                      ) : null}

                      {oauthSession.progress.length > 0 ? (
                        <div className="space-y-2 text-xs text-muted-foreground">
                          {oauthSession.progress
                            .slice(-4)
                            .map((message, index) => (
                              <div
                                key={`${message}-${String(index)}`}
                                className="flex items-center gap-2"
                              >
                                <span className="size-1.5 rounded-full bg-primary/70" />
                                <span>{message}</span>
                              </div>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}

              {(connectionMode === "application_default" ||
                connectionMode === "aws_sdk" ||
                selectedProvider.environment.available) && (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Use local environment credentials
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Select this provider using credentials already available on
                      the machine.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full justify-between rounded-full"
                    disabled={!client || !selectedProvider.environment.available || isBusy}
                    onClick={() => {
                      void handleEnvironmentSelection();
                    }}
                  >
                    Select environment auth
                    {isBusy ? (
                      <LoaderCircleIcon className="size-4 animate-spin" />
                    ) : (
                      <BadgeCheckIcon className="size-4" />
                    )}
                  </Button>
                </div>
              )}

              {feedback ? (
                <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">
                  {feedback}
                </p>
              ) : null}

              {errorMessage || runtimeError ? (
                <p className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  {errorMessage ?? runtimeError}
                </p>
              ) : null}

              <Button
                className="w-full justify-between rounded-full"
                disabled={!canContinue}
                onClick={onContinue}
              >
                Continue to workspace
                <ArrowRightIcon className="size-4" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyDetailState({ runtimeError }: { runtimeError: string | null }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
      {runtimeError ??
        "The local sidecar is not available yet. Start the desktop host to enable provider connections."}
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheckIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5 text-primary" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function renderMethodLabel(method: ConnectionMode): string {
  switch (method) {
    case "api_key":
      return "API key";
    case "application_default":
      return "App default";
    case "aws_sdk":
      return "AWS SDK";
    case "oauth":
      return "SSO";
    case "token":
      return "Token";
  }
}

function resolveDefaultConnectionMode(provider: ProviderStatus): ConnectionMode {
  const preferredOrder: ConnectionMode[] = [
    "oauth",
    "api_key",
    "token",
    "application_default",
    "aws_sdk",
  ];

  for (const method of preferredOrder) {
    if (provider.provider.authMethods.includes(method)) {
      return method;
    }
  }

  return "oauth";
}

function renderOAuthSessionMessage(session: OAuthSession): string {
  switch (session.step.type) {
    case "auth_link":
      return session.step.instructions ?? "Continue the sign-in flow in your browser.";
    case "completed":
      return "Provider connected successfully.";
    case "error":
      return session.step.message;
    case "prompt":
      return session.step.message;
    case "working":
      return session.step.message;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function openSessionLink(
  url: string,
  openedLinks: Set<string>,
  force = false,
): Promise<void> {
  if (!force && openedLinks.has(url)) {
    return;
  }

  openedLinks.add(url);
  await openExternalUrl(url);
}

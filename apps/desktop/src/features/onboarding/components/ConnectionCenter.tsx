import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { openExternalUrl } from "@/lib/platform/open-external-url";
import type { AuthOverview, OAuthSession } from "@/app/types";
import { SidecarClient } from "@/lib/sidecar/client";
import {
  buildProviderFamilies,
  type ConnectionMode,
  type ProviderFamily,
  type ProviderFamilyOption,
} from "../provider-families";

interface ConnectionCenterProps {
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
  isLoading: boolean;
  onAuthOverviewChange: (nextOverview: AuthOverview) => void;
  onContinue: () => void;
  onRetry: () => void;
  runtimeError: string | null;
}

export function ConnectionCenter({
  authOverview,
  client,
  isLoading,
  onAuthOverviewChange,
  onContinue,
  onRetry,
  runtimeError,
}: ConnectionCenterProps) {
  const providerFamilies = buildProviderFamilies(authOverview);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [profileLabel, setProfileLabel] = useState("default");
  const [secret, setSecret] = useState("");
  const [oauthSession, setOAuthSession] = useState<OAuthSession | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const openedLinksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (providerFamilies.length === 0) {
      setSelectedFamilyId(null);
      setSelectedOptionKey(null);
      return;
    }

    const preferredProviderId = authOverview?.selectedProviderId;
    const preferredFamily = preferredProviderId
      ? providerFamilies.find((family) =>
          family.options.some((option) => option.providerId === preferredProviderId),
        )
      : undefined;
    const nextFamily = preferredFamily ?? providerFamilies[0];

    if (!nextFamily) {
      return;
    }

    if (
      !selectedFamilyId ||
      !providerFamilies.some((family) => family.id === selectedFamilyId)
    ) {
      setSelectedFamilyId(nextFamily.id);
    }

    if (preferredProviderId) {
      const preferredOption = nextFamily.options.find(
        (option) => option.providerId === preferredProviderId,
      );

      if (preferredOption && preferredOption.key !== selectedOptionKey) {
        setSelectedOptionKey(preferredOption.key);
      }
    }
  }, [authOverview?.selectedProviderId, providerFamilies, selectedFamilyId, selectedOptionKey]);

  const selectedFamily =
    providerFamilies.find((family) => family.id === selectedFamilyId) ??
    providerFamilies[0] ??
    null;

  useEffect(() => {
    if (!selectedFamily) {
      setSelectedOptionKey(null);
      return;
    }

    if (
      !selectedOptionKey ||
      !selectedFamily.options.some((option) => option.key === selectedOptionKey)
    ) {
      setSelectedOptionKey(selectedFamily.options[0]?.key ?? null);
    }
  }, [selectedFamily, selectedOptionKey]);

  const selectedOption =
    selectedFamily?.options.find((option) => option.key === selectedOptionKey) ??
    selectedFamily?.options[0] ??
    null;
  const selectedProviderStatus = selectedOption?.providerStatus;
  const oauthLinkUrl =
    oauthSession?.step.type === "auth_link" ? oauthSession.step.url : null;
  const connectedFamilyCount = providerFamilies.filter((family) =>
    family.options.some((option) => option.isConnected),
  ).length;
  const canContinue = Boolean(authOverview?.selectedProviderId);

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

  async function refreshOverview(): Promise<void> {
    if (!client) {
      return;
    }

    const nextOverview = await client.authOverview();
    onAuthOverviewChange(nextOverview);
  }

  async function handleSecretConnect(): Promise<void> {
    if (!client || !selectedOption) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      await client.connectProviderSecret({
        label: profileLabel.trim() || "default",
        providerId: selectedOption.providerId,
        secret: secret.trim(),
      });
      await refreshOverview();
      setSecret("");
      setFeedback(`Connected ${selectedFamily?.title ?? "provider"}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleEnvironmentSelection(): Promise<void> {
    if (!client || !selectedOption) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      await client.selectProvider(selectedOption.providerId);
      await refreshOverview();
      setFeedback(`Selected ${selectedFamily?.title ?? "provider"}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleOAuthStart(): Promise<void> {
    if (!client || !selectedOption) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      const session = await client.startOAuthSession({
        label: profileLabel.trim() || "default",
        providerId: selectedOption.providerId,
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

    setErrorMessage(null);
    setIsBusy(true);

    try {
      const nextSession = await client.submitOAuthSessionPrompt(
        oauthSession.id,
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(180deg,_rgba(250,249,245,1)_0%,_rgba(245,243,237,1)_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              CapyFin
            </p>
            <p className="text-sm text-muted-foreground">
              Connect a provider to finish desktop setup.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              icon={ShieldCheckIcon}
              label={`${String(connectedFamilyCount)} providers connected`}
            />
            <StatusPill
              icon={SparklesIcon}
              label={
                authOverview?.selectedProviderId
                  ? `${authOverview.selectedProviderId} selected`
                  : "No provider selected"
              }
            />
            <Button
              variant="outline"
              className="rounded-full"
              disabled={isLoading}
              onClick={onRetry}
            >
              {isLoading ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <RefreshCcwIcon className="size-4" />
              )}
              Retry
            </Button>
          </div>
        </div>

        <div className="mt-10 grid flex-1 gap-8 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <section className="space-y-6">
            <div className="space-y-4">
              <Badge className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em]">
                Welcome
              </Badge>
              <div className="max-w-3xl space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
                  Choose the provider you want to use in CapyFin.
                </h1>
                <p className="text-base leading-7 text-muted-foreground">
                  Start with one provider. You can add more later. For providers
                  that support account-based access, CapyFin opens the browser
                  sign-in flow and continues the handoff here.
                </p>
              </div>
            </div>

            {runtimeError ? (
              <div className="rounded-3xl border border-amber-500/25 bg-amber-500/8 px-5 py-4 text-sm text-amber-800">
                <p className="font-medium">Provider services are not ready yet.</p>
                <p className="mt-1">
                  {runtimeError}
                </p>
                <p className="mt-2 text-amber-900/80">
                  You can still browse the supported providers below. Connection
                  actions will unlock once the desktop host finishes starting.
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {isLoading && providerFamilies.length === 0
                ? Array.from({ length: 9 }, (_, index) => (
                    <Card
                      key={String(index)}
                      className="min-h-52 animate-pulse rounded-3xl border-border/60 bg-card/70"
                    />
                  ))
                : providerFamilies.map((family) => (
                    <button
                      key={family.id}
                      type="button"
                      className="text-left"
                      onClick={() => {
                        setSelectedFamilyId(family.id);
                        setSelectedOptionKey(family.options[0]?.key ?? null);
                        setOAuthSession(null);
                        setErrorMessage(null);
                        setFeedback(null);
                      }}
                    >
                      <ProviderFamilyCard
                        family={family}
                        isSelected={family.id === selectedFamily?.id}
                      />
                    </button>
                  ))}
            </div>
          </section>

          <section>
            <Card className="h-full rounded-[2rem] border-border/70 bg-card/95 shadow-xl shadow-black/5 xl:sticky xl:top-10">
              <CardHeader className="space-y-4 border-b border-border/70 pb-5">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">
                    {selectedFamily?.title ?? "Choose a provider"}
                  </CardTitle>
                  <CardDescription className="text-sm leading-6">
                    {selectedFamily?.description ??
                      "Select a provider on the left to choose how you want to connect."}
                  </CardDescription>
                </div>

                {selectedFamily ? (
                  <div className="grid gap-2">
                    {selectedFamily.options.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          setSelectedOptionKey(option.key);
                          setOAuthSession(null);
                          setErrorMessage(null);
                          setFeedback(null);
                        }}
                        className="text-left"
                      >
                        <AuthOptionButton
                          option={option}
                          isSelected={option.key === selectedOption?.key}
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </CardHeader>

              <CardContent className="space-y-5 p-6">
                {!selectedOption ? (
                  <EmptyDetailState />
                ) : (
                  <>
                    <div className="rounded-3xl border border-border/70 bg-background/85 p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-full">
                          {selectedOption.label}
                        </Badge>
                        {selectedOption.isSelected ? (
                          <Badge className="rounded-full bg-emerald-600/90 text-white">
                            Selected
                          </Badge>
                        ) : null}
                        {selectedOption.isConnected ? (
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-emerald-500/10 text-emerald-700"
                          >
                            Connected
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {selectedOption.description}
                      </p>
                      {selectedProviderStatus?.resolved ? (
                        <p className="mt-3 text-sm font-medium text-foreground">
                          Current selection: {selectedProviderStatus.resolved.description}
                        </p>
                      ) : null}
                    </div>

                    {(selectedOption.mode === "api_key" ||
                      selectedOption.mode === "token") && (
                      <CredentialForm
                        buttonLabel={`Connect with ${selectedOption.label.toLowerCase()}`}
                        disabled={!client || !secret.trim() || isBusy}
                        inputLabel={
                          selectedOption.mode === "token" ? "Token" : "API key"
                        }
                        inputPlaceholder={
                          selectedOption.mode === "token"
                            ? "Paste provider token"
                            : "Paste provider API key"
                        }
                        isBusy={isBusy}
                        profileLabel={profileLabel}
                        secret={secret}
                        onProfileLabelChange={setProfileLabel}
                        onSecretChange={setSecret}
                        onSubmit={() => {
                          void handleSecretConnect();
                        }}
                      />
                    )}

                    {selectedOption.mode === "oauth" && (
                      <OAuthCard
                        isBusy={isBusy}
                        oauthLinkUrl={oauthLinkUrl}
                        oauthSession={oauthSession}
                        onOpenLinkAgain={() => {
                          if (!oauthLinkUrl) {
                            return;
                          }

                          void openSessionLink(
                            oauthLinkUrl,
                            openedLinksRef.current,
                            true,
                          );
                        }}
                        onProfileLabelChange={setProfileLabel}
                        onPromptValueChange={setPromptValue}
                        onStart={() => {
                          void handleOAuthStart();
                        }}
                        onSubmitPrompt={() => {
                          void handleOAuthPromptSubmit();
                        }}
                        profileLabel={profileLabel}
                        promptValue={promptValue}
                        providerLabel={selectedFamily?.title ?? "provider"}
                      />
                    )}

                    {(selectedOption.mode === "application_default" ||
                      selectedOption.mode === "aws_sdk") && (
                      <EnvironmentCard
                        disabled={
                          !client ||
                          !selectedProviderStatus?.environment.available ||
                          isBusy
                        }
                        isBusy={isBusy}
                        mode={selectedOption.mode}
                        onSelect={() => {
                          void handleEnvironmentSelection();
                        }}
                      />
                    )}

                    {feedback ? (
                      <MessageBox tone="success">{feedback}</MessageBox>
                    ) : null}

                    {errorMessage ? (
                      <MessageBox tone="error">{errorMessage}</MessageBox>
                    ) : null}

                    {runtimeError ? (
                      <MessageBox tone="warning">
                        Connection actions require the desktop host and sidecar to
                        be running.
                      </MessageBox>
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
          </section>
        </div>
      </div>
    </div>
  );
}

function ProviderFamilyCard({
  family,
  isSelected,
}: {
  family: ProviderFamily;
  isSelected: boolean;
}) {
  return (
    <Card
      className={cn(
        "h-full rounded-[1.75rem] border-border/70 bg-card/92 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg",
        isSelected ? "border-primary/60 shadow-lg shadow-primary/10" : "",
      )}
    >
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">{family.title}</CardTitle>
            <CardDescription className="line-clamp-2 text-sm leading-6">
              {family.description}
            </CardDescription>
          </div>
          {family.isSelected ? (
            <Badge className="rounded-full bg-emerald-600/90 text-white">
              Selected
            </Badge>
          ) : family.isConnected ? (
            <Badge
              variant="secondary"
              className="rounded-full bg-emerald-500/10 text-emerald-700"
            >
              Connected
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {family.options.map((option) => (
            <Badge
              key={option.key}
              variant="outline"
              className="rounded-full border-border/70 bg-background/70 px-2.5 py-0.5 text-[11px]"
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AuthOptionButton({
  isSelected,
  option,
}: {
  isSelected: boolean;
  option: ProviderFamilyOption;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/70 bg-background/70 px-4 py-3 transition-colors",
        isSelected ? "border-primary/50 bg-primary/5" : "",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{option.label}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {option.description}
          </p>
        </div>
        <ArrowRightIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            isSelected ? "translate-x-0.5 text-primary" : "",
          )}
        />
      </div>
    </div>
  );
}

function CredentialForm({
  buttonLabel,
  disabled,
  inputLabel,
  inputPlaceholder,
  isBusy,
  onProfileLabelChange,
  onSecretChange,
  onSubmit,
  profileLabel,
  secret,
}: {
  buttonLabel: string;
  disabled: boolean;
  inputLabel: string;
  inputPlaceholder: string;
  isBusy: boolean;
  onProfileLabelChange: (value: string) => void;
  onSecretChange: (value: string) => void;
  onSubmit: () => void;
  profileLabel: string;
  secret: string;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-border/70 bg-background/70 p-5">
      <div className="space-y-1">
        <p className="font-medium text-foreground">Store credentials locally</p>
        <p className="text-sm leading-6 text-muted-foreground">
          The secret is saved in the local auth profile store and activated for
          the selected provider.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Profile label
        </span>
        <Input
          value={profileLabel}
          onChange={(event) => {
            onProfileLabelChange(event.target.value);
          }}
          placeholder="default"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {inputLabel}
        </span>
        <Input
          value={secret}
          onChange={(event) => {
            onSecretChange(event.target.value);
          }}
          placeholder={inputPlaceholder}
          type="password"
        />
      </label>

      <Button
        className="w-full justify-between rounded-full"
        disabled={disabled}
        onClick={onSubmit}
      >
        {buttonLabel}
        {isBusy ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          <KeyRoundIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}

function OAuthCard({
  isBusy,
  oauthLinkUrl,
  oauthSession,
  onOpenLinkAgain,
  onProfileLabelChange,
  onPromptValueChange,
  onStart,
  onSubmitPrompt,
  profileLabel,
  promptValue,
  providerLabel,
}: {
  isBusy: boolean;
  oauthLinkUrl: string | null;
  oauthSession: OAuthSession | null;
  onOpenLinkAgain: () => void;
  onProfileLabelChange: (value: string) => void;
  onPromptValueChange: (value: string) => void;
  onStart: () => void;
  onSubmitPrompt: () => void;
  profileLabel: string;
  promptValue: string;
  providerLabel: string;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-border/70 bg-background/70 p-5">
      <div className="space-y-1">
        <p className="font-medium text-foreground">Continue in your browser</p>
        <p className="text-sm leading-6 text-muted-foreground">
          CapyFin opens the sign-in page for {providerLabel} and keeps the
          follow-up handoff on this screen.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Profile label
        </span>
        <Input
          value={profileLabel}
          onChange={(event) => {
            onProfileLabelChange(event.target.value);
          }}
          placeholder="default"
        />
      </label>

      <Button
        className="w-full justify-between rounded-full"
        disabled={isBusy}
        onClick={onStart}
      >
        Start sign-in
        {isBusy ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          <ExternalLinkIcon className="size-4" />
        )}
      </Button>

      {oauthSession ? (
        <div className="space-y-3 rounded-3xl border border-primary/18 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">
            {renderOAuthSessionMessage(oauthSession)}
          </p>

          {oauthLinkUrl ? (
            <Button
              variant="outline"
              className="w-full justify-between rounded-full"
              onClick={onOpenLinkAgain}
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
                  onPromptValueChange(event.target.value);
                }}
                placeholder={
                  oauthSession.step.placeholder ?? "Enter the requested value"
                }
              />
              <Button
                className="w-full justify-between rounded-full"
                disabled={
                  isBusy ||
                  (!oauthSession.step.allowEmpty && promptValue.trim().length === 0)
                }
                onClick={onSubmitPrompt}
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
              {oauthSession.progress.slice(-4).map((message, index) => (
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
  );
}

function EnvironmentCard({
  disabled,
  isBusy,
  mode,
  onSelect,
}: {
  disabled: boolean;
  isBusy: boolean;
  mode: Extract<ConnectionMode, "application_default" | "aws_sdk">;
  onSelect: () => void;
}) {
  const label =
    mode === "aws_sdk" ? "Use AWS credentials" : "Use local cloud credentials";

  return (
    <div className="space-y-4 rounded-3xl border border-border/70 bg-background/70 p-5">
      <div className="space-y-1">
        <p className="font-medium text-foreground">Use existing machine auth</p>
        <p className="text-sm leading-6 text-muted-foreground">
          Select this option when credentials are already available on the local
          machine.
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full justify-between rounded-full"
        disabled={disabled}
        onClick={onSelect}
      >
        {label}
        {isBusy ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          <BadgeCheckIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}

function EmptyDetailState() {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/70 p-5 text-sm text-muted-foreground">
      Pick a provider to choose how you want to authenticate.
    </div>
  );
}

function MessageBox({
  children,
  tone,
}: {
  children: string;
  tone: "error" | "success" | "warning";
}) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-700"
      : tone === "warning"
        ? "border-amber-500/20 bg-amber-500/8 text-amber-800"
        : "border-destructive/20 bg-destructive/8 text-destructive";

  return <p className={cn("rounded-3xl px-4 py-3 text-sm", toneClasses)}>{children}</p>;
}

function StatusPill({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheckIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5 text-primary" />
      <span>{label}</span>
    </div>
  );
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

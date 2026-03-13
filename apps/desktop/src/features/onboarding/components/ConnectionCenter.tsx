import { startTransition, useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  RefreshCcwIcon,
} from "lucide-react";
import anthropicLogo from "simple-icons/icons/anthropic.svg?raw";
import githubCopilotLogo from "simple-icons/icons/githubcopilot.svg?raw";
import googleGeminiLogo from "simple-icons/icons/googlegemini.svg?raw";
import huggingFaceLogo from "simple-icons/icons/huggingface.svg?raw";
import mistralLogo from "simple-icons/icons/mistralai.svg?raw";
import openRouterLogo from "simple-icons/icons/openrouter.svg?raw";
import vercelLogo from "simple-icons/icons/vercel.svg?raw";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { openExternalUrl } from "@/lib/platform/open-external-url";
import type { AuthOverview, OAuthSession } from "@/app/types";
import { SidecarClient } from "@/lib/sidecar/client";
import {
  buildProviderFamilies,
  type ConnectionMode,
  type ProviderFamily,
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

type SetupStep = "providers" | "configure";

const providerLogos: Partial<Record<string, { color: string; svg: string }>> = {
  anthropic: { svg: anthropicLogo, color: "#191919" },
  google: { svg: googleGeminiLogo, color: "#4285F4" },
  "github-copilot": { svg: githubCopilotLogo, color: "#171515" },
  huggingface: { svg: huggingFaceLogo, color: "#FFD21E" },
  mistral: { svg: mistralLogo, color: "#FF7000" },
  openrouter: { svg: openRouterLogo, color: "#111111" },
  "vercel-ai-gateway": { svg: vercelLogo, color: "#111111" },
};

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
  const [step, setStep] = useState<SetupStep>("providers");
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
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
    oauthSession?.authUrl ??
    (oauthSession?.step.type === "auth_link" ? oauthSession.step.url : null);
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
        if (nextSession.authUrl) {
          void openSessionLink(nextSession.authUrl, openedLinksRef.current);
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
        label: "default",
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
    if (!selectedOption) {
      return;
    }

    if (!client) {
      setErrorMessage(
        "CapyFin is still preparing secure sign-in. Please try again in a moment.",
      );
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      const session = await client.startOAuthSession({
        label: "default",
        providerId: selectedOption.providerId,
      });
      setOAuthSession(session);

      if (session.authUrl) {
        await openSessionLink(session.authUrl, openedLinksRef.current);
      } else if (session.step.type === "auth_link") {
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

  const runtimeMessage = resolveRuntimeMessage(runtimeError);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_rgba(248,246,240,1)_0%,_rgba(241,238,230,1)_100%)]">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-emerald-700">
              CapyFin
            </p>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                {step === "providers" ? "Choose a provider" : selectedFamily?.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {step === "providers"
                  ? "Pick one provider to get started. The next screen handles the exact connection method."
                  : selectedFamily?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === "configure" ? (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  startTransition(() => {
                    setStep("providers");
                    setErrorMessage(null);
                    setFeedback(null);
                    setOAuthSession(null);
                  });
                }}
              >
                <ArrowLeftIcon className="size-4" />
                Back
              </Button>
            ) : null}
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

        {runtimeMessage ? (
          <div className="mt-6 rounded-3xl border border-amber-500/25 bg-amber-500/8 px-5 py-4 text-sm text-amber-900">
            {runtimeMessage}
          </div>
        ) : null}

        {step === "providers" ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading && providerFamilies.length === 0
              ? Array.from({ length: 9 }, (_, index) => (
                  <div
                    key={String(index)}
                    className="min-h-44 animate-pulse rounded-[1.75rem] border border-border/60 bg-card/75"
                  />
                ))
              : providerFamilies.map((family) => (
                  <button
                    key={family.id}
                    type="button"
                    className="text-left"
                    onClick={() => {
                      startTransition(() => {
                        setSelectedFamilyId(family.id);
                        setSelectedOptionKey(family.options[0]?.key ?? null);
                        setOAuthSession(null);
                        setErrorMessage(null);
                        setFeedback(null);
                        setStep("configure");
                      });
                    }}
                  >
                    <ProviderCard family={family} />
                  </button>
                ))}
          </div>
        ) : selectedFamily && selectedOption ? (
          <section className="mt-10">
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-border/70 bg-card/96 px-6 py-6 shadow-sm sm:px-8 sm:py-8">
              <div className="flex items-start gap-4">
                <ProviderLogo family={selectedFamily} size="lg" />
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                    {selectedFamily.title}
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    {selectedFamily.id === "openai"
                      ? "Sign in with Codex by default, or switch to a direct API key if you prefer."
                      : "Choose the connection method you want to use."}
                  </p>
                </div>
              </div>

              {selectedFamily.options.length > 1 ? (
                <div className="mt-6 flex flex-wrap gap-2">
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
                      className={cn(
                        "rounded-full px-4 py-2 text-sm transition-colors",
                        option.key === selectedOption.key
                          ? "bg-foreground text-background"
                          : "bg-background text-muted-foreground ring-1 ring-border/80 hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 space-y-6">
                {(selectedOption.mode === "api_key" ||
                  selectedOption.mode === "token") && (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium text-foreground">
                        {selectedOption.mode === "token" ? "Enter your token" : "Enter your API key"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedOption.description}
                      </p>
                    </div>
                    <CredentialForm
                      buttonLabel="Connect"
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
                      secret={secret}
                      onSecretChange={setSecret}
                      onSubmit={() => {
                        void handleSecretConnect();
                      }}
                    />
                  </div>
                )}

                {selectedOption.mode === "oauth" && (
                  <OAuthCard
                    isBusy={isBusy}
                    isReady={Boolean(client)}
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
                    onPromptValueChange={setPromptValue}
                    onStart={() => {
                      void handleOAuthStart();
                    }}
                    onSubmitPrompt={() => {
                      void handleOAuthPromptSubmit();
                    }}
                    promptValue={promptValue}
                    optionLabel={selectedOption.label}
                    providerTitle={selectedFamily.title}
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

                {selectedProviderStatus?.resolved ? (
                  <p className="text-sm text-muted-foreground">
                    Active connection:{" "}
                    <span className="font-medium text-foreground">
                      {selectedProviderStatus.resolved.description}
                    </span>
                  </p>
                ) : null}

                {feedback ? <MessageBox tone="success">{feedback}</MessageBox> : null}
                {errorMessage ? <MessageBox tone="error">{errorMessage}</MessageBox> : null}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-5">
                  <p className="text-sm text-muted-foreground">
                    Continue after the provider is connected.
                  </p>
                  <Button
                    className="rounded-full"
                    disabled={!canContinue}
                    onClick={onContinue}
                  >
                    Continue
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function ProviderCard({ family }: { family: ProviderFamily }) {
  return (
    <div className="h-full rounded-[1.75rem] border border-border/70 bg-card/94 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <ProviderLogo family={family} size="sm" />
        <div className="min-w-0">
          <p className="text-2xl font-semibold text-foreground">{family.title}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">{family.description}</p>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {family.options[0]?.label ?? "Connect"}
        </p>
        <ArrowRightIcon className="size-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function ProviderLogo({
  family,
  size,
}: {
  family: ProviderFamily;
  size: "lg" | "sm";
}) {
  const logo = providerLogos[family.id];
  const sizeClasses =
    size === "lg" ? "size-14 rounded-2xl text-[18px]" : "size-11 rounded-xl text-sm";

  if (!logo) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-foreground font-semibold uppercase text-background",
          sizeClasses,
        )}
      >
        {renderFallbackInitials(family.title)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center border border-border/70 bg-background [&_svg]:size-[60%] [&_svg]:fill-current",
        sizeClasses,
      )}
      style={{ color: logo.color }}
      dangerouslySetInnerHTML={{ __html: logo.svg }}
    />
  );
}

function CredentialForm({
  buttonLabel,
  disabled,
  inputLabel,
  inputPlaceholder,
  isBusy,
  onSecretChange,
  onSubmit,
  secret,
}: {
  buttonLabel: string;
  disabled: boolean;
  inputLabel: string;
  inputPlaceholder: string;
  isBusy: boolean;
  onSecretChange: (value: string) => void;
  onSubmit: () => void;
  secret: string;
}) {
  return (
    <div className="space-y-5">
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
  isReady,
  oauthLinkUrl,
  oauthSession,
  onOpenLinkAgain,
  optionLabel,
  onPromptValueChange,
  onStart,
  onSubmitPrompt,
  promptValue,
  providerTitle,
}: {
  isBusy: boolean;
  isReady: boolean;
  oauthLinkUrl: string | null;
  oauthSession: OAuthSession | null;
  onOpenLinkAgain: () => void;
  optionLabel: string;
  onPromptValueChange: (value: string) => void;
  onStart: () => void;
  onSubmitPrompt: () => void;
  promptValue: string;
  providerTitle: string;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">{optionLabel}</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          Sign in with your {providerTitle} account in the browser. When the
          browser asks for a code or confirmation, continue here.
        </p>
      </div>

      <Button
        className="w-full justify-between rounded-full sm:w-auto sm:min-w-64"
        disabled={!isReady || isBusy}
        onClick={onStart}
      >
        Start sign-in
        {isBusy ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          <ExternalLinkIcon className="size-4" />
        )}
      </Button>

      {!isReady ? (
        <p className="text-sm text-muted-foreground">
          CapyFin is preparing secure sign-in.
        </p>
      ) : null}

      {oauthSession ? (
        <div className="space-y-3 rounded-2xl border border-primary/18 bg-primary/5 p-4">
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
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-foreground">{label}</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          Use credentials that are already available on this machine.
        </p>
      </div>
      <Button
        variant="outline"
        className="w-full justify-between rounded-full sm:w-auto sm:min-w-72"
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

function MessageBox({
  children,
  tone,
}: {
  children: string;
  tone: "error" | "success";
}) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-700"
      : "border-destructive/20 bg-destructive/8 text-destructive";

  return <p className={cn("rounded-3xl px-4 py-3 text-sm", toneClasses)}>{children}</p>;
}

function renderFallbackInitials(title: string): string {
  return title
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function resolveRuntimeMessage(runtimeError: string | null): string | null {
  if (!runtimeError) {
    return null;
  }

  if (!isTauriRuntime()) {
    return "CapyFin needs to finish opening before sign-in is available.";
  }

  return "CapyFin couldn't finish setup yet. Retrying in a moment usually fixes it.";
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
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

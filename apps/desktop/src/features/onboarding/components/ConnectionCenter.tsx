import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  LoaderCircleIcon,
  RefreshCcwIcon,
  XIcon,
} from "lucide-react";
import anthropicLogo from "simple-icons/icons/anthropic.svg?raw";
import githubCopilotLogo from "simple-icons/icons/githubcopilot.svg?raw";
import googleGeminiLogo from "simple-icons/icons/googlegemini.svg?raw";
import huggingFaceLogo from "simple-icons/icons/huggingface.svg?raw";
import mistralLogo from "simple-icons/icons/mistralai.svg?raw";
import openRouterLogo from "simple-icons/icons/openrouter.svg?raw";
import vercelLogo from "simple-icons/icons/vercel.svg?raw";
import type {
  AuthOverview,
  AuthSession,
  ProviderDefinition,
  ProviderModelCatalog,
} from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { openExternalUrl } from "@/lib/platform/open-external-url";
import { SidecarClient } from "@/lib/sidecar/client";

interface ConnectionCenterProps {
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
  isLoading: boolean;
  onClose?: () => void;
  onAuthOverviewChange: (nextOverview: AuthOverview) => void;
  onContinue: () => void;
  onRetry: () => void;
  runtimeError: string | null;
}

type SetupStep = "providers" | "configure";

const providerLogos: Partial<Record<string, { color: string; darkColor?: string; svg: string }>> = {
  anthropic: { color: "#191919", darkColor: "#e8e8e8", svg: anthropicLogo },
  copilot: { color: "#171515", darkColor: "#e0e0e0", svg: githubCopilotLogo },
  google: { color: "#4285F4", svg: googleGeminiLogo },
  huggingface: { color: "#FFD21E", svg: huggingFaceLogo },
  mistral: { color: "#FF7000", svg: mistralLogo },
  openrouter: { color: "#111111", darkColor: "#e0e0e0", svg: openRouterLogo },
  "ai-gateway": { color: "#111111", darkColor: "#e0e0e0", svg: vercelLogo },
};

export function ConnectionCenter({
  authOverview,
  client,
  isLoading,
  onClose,
  onAuthOverviewChange,
  onContinue,
  onRetry,
  runtimeError,
}: ConnectionCenterProps) {
  const providers = useMemo(() => authOverview?.providers ?? [], [authOverview?.providers]);
  const [step, setStep] = useState<SetupStep>("providers");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [sessionInputValue, setSessionInputValue] = useState("");
  const [sessionSelections, setSessionSelections] = useState<string[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [modelCatalog, setModelCatalog] = useState<ProviderModelCatalog | null>(null);
  const [selectedModelRef, setSelectedModelRef] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const openedAuthLinkRef = useRef<string | null>(null);
  const handledCompletedSessionRef = useRef<string | null>(null);

  const connectedProviderIds = useMemo(
    () => new Set((authOverview?.connections ?? []).map((connection) => connection.providerId)),
    [authOverview],
  );
  const canContinue = Boolean(authOverview?.selectedProviderId);

  useEffect(() => {
    if (providers.length === 0) {
      setSelectedProviderId(null);
      return;
    }

    const preferred =
      providers.find((provider) =>
        provider.methods.some((method) => method.providerId === authOverview?.selectedProviderId),
      ) ?? providers[0];
    if (!preferred) {
      return;
    }

    setSelectedProviderId((current) =>
      current && providers.some((provider) => provider.id === current) ? current : preferred.id,
    );
  }, [authOverview?.selectedProviderId, providers]);

  const selectedProvider =
    providers.find((provider) => provider.id === selectedProviderId) ?? providers[0] ?? null;

  useEffect(() => {
    if (!selectedProvider) {
      setSelectedMethodId(null);
      return;
    }

    setSelectedMethodId((current) =>
      current && selectedProvider.methods.some((method) => method.id === current)
        ? current
        : selectedProvider.methods[0]?.id ?? null,
    );
  }, [selectedProvider]);

  const selectedMethod =
    selectedProvider?.methods.find((method) => method.id === selectedMethodId) ??
    selectedProvider?.methods[0] ??
    null;

  useEffect(() => {
    if (!client || !selectedMethod) {
      setModelCatalog(null);
      setSelectedModelRef("");
      return;
    }

    let cancelled = false;
    const runtimeClient = client;
    const runtimeMethod = selectedMethod;

    async function loadProviderModels(): Promise<void> {
      try {
        const catalog = await runtimeClient.providerModels(runtimeMethod.providerId);
        if (cancelled) {
          return;
        }
        setErrorMessage(null);
        setModelCatalog(catalog);
        setSelectedModelRef(catalog.currentModelRef ?? catalog.models[0]?.modelRef ?? "");
      } catch (error) {
        if (!cancelled) {
          setModelCatalog(null);
          setSelectedModelRef("");
          setErrorMessage(getErrorMessage(error));
        }
      }
    }

    void loadProviderModels();

    return () => {
      cancelled = true;
    };
  }, [client, selectedMethod]);

  useEffect(() => {
    if (!client || authSession?.state !== "pending") {
      return;
    }

    let cancelled = false;

    const syncSession = async (): Promise<void> => {
      try {
        const nextSession = await client.getAuthSession(authSession.id);
        if (cancelled) {
          return;
        }
        setAuthSession(nextSession);

        if (nextSession.step.type === "auth_link") {
          const authLinkKey = `${nextSession.id}:${nextSession.step.url}`;
          if (openedAuthLinkRef.current !== authLinkKey) {
            openedAuthLinkRef.current = authLinkKey;
            await openExternalUrl(nextSession.step.url);
          }
        }

        if (nextSession.state === "completed") {
          if (handledCompletedSessionRef.current === nextSession.id) {
            return;
          }
          handledCompletedSessionRef.current = nextSession.id;
          let nextOverview: AuthOverview;
          if (selectedMethod && selectedModelRef.trim()) {
            nextOverview = await client.setProviderModel(
              selectedMethod.providerId,
              selectedModelRef.trim(),
            );
          } else {
            nextOverview = await client.authOverview();
          }
          const nextCatalog = selectedMethod
            ? await client.providerModels(selectedMethod.providerId)
            : null;
          onAuthOverviewChange(nextOverview);
          setModelCatalog(nextCatalog);
          setSelectedModelRef(nextCatalog?.currentModelRef ?? selectedModelRef);
          setFeedback(
            nextSession.connection
              ? `Connected ${nextSession.connection.providerName}.`
              : `${nextSession.providerName} is ready.`,
          );
          setSessionInputValue("");
          setSessionSelections([]);
        }

        if (nextSession.state === "error") {
          setErrorMessage(nextSession.error ?? "Could not complete the connection.");
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
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [authSession, client, onAuthOverviewChange, selectedMethod, selectedModelRef]);

  async function handleSecretConnect(): Promise<void> {
    if (!client || !selectedMethod) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      const connection = await client.connectProviderSecret({
        authChoice: selectedMethod.id,
        secret: secret.trim(),
      });
      const nextOverview = selectedModelRef.trim()
        ? await client.setProviderModel(selectedMethod.providerId, selectedModelRef.trim())
        : await client.authOverview();
      const nextCatalog = await client.providerModels(selectedMethod.providerId);
      startTransition(() => {
        onAuthOverviewChange(nextOverview);
        setModelCatalog(nextCatalog);
        setSelectedModelRef(nextCatalog.currentModelRef ?? selectedModelRef);
        setSecret("");
      });
      setFeedback(`Connected ${connection.providerName}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStartAuthSession(): Promise<void> {
    if (!client || !selectedMethod) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      const session = await client.startAuthSession({
        authChoice: selectedMethod.id,
      });
      openedAuthLinkRef.current = null;
      handledCompletedSessionRef.current = null;
      setSessionInputValue("");
      setSessionSelections([]);
      setAuthSession(session);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRespondToSession(
    valueOverride?: boolean | string | string[],
  ): Promise<void> {
    if (!client || !authSession) {
      return;
    }

    setErrorMessage(null);
    setIsBusy(true);

    try {
      const step = authSession.step;
      const value = valueOverride ?? (
        step.type === "confirm_prompt"
          ? true
          : step.type === "select_prompt"
            ? step.allowMultiple
              ? sessionSelections
              : sessionSelections[0] ?? ""
            : sessionInputValue
      );
      const nextSession = await client.respondToAuthSession(authSession.id, value);
      setAuthSession(nextSession);
      if (step.type === "text_prompt") {
        setSessionInputValue("");
      }
      if (step.type === "select_prompt") {
        setSessionSelections([]);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="ambient-glow relative min-h-screen overflow-hidden bg-background px-6 py-8 text-foreground lg:px-12 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.38em] text-primary">
              CapyFin
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground lg:text-6xl">
              {step === "providers" ? "Connect a provider" : selectedProvider?.name ?? "Connection"}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              {step === "providers"
                ? "Choose the model provider you want to use. You can always add more later."
                : selectedProvider?.description ??
                  "Choose how you want to connect, then finish the setup on this page."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {step === "configure" ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  openedAuthLinkRef.current = null;
                  handledCompletedSessionRef.current = null;
                  setAuthSession(null);
                  setErrorMessage(null);
                  setFeedback(null);
                  setSecret("");
                  setSessionInputValue("");
                  setSessionSelections([]);
                  setModelCatalog(null);
                  setSelectedModelRef("");
                  setStep("providers");
                }}
              >
                <ArrowLeftIcon className="size-4" />
                Back
              </Button>
            ) : null}
            {onClose ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={onClose}
              >
                <XIcon className="size-4" />
                Close
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={!client || isBusy || isLoading}
              onClick={() => {
                setErrorMessage(null);
                setFeedback(null);
                onRetry();
              }}
            >
              <RefreshCcwIcon className="size-4" />
              Retry
            </Button>
          </div>
        </header>

        <div className="mt-10 flex flex-1 flex-col gap-6">
          {runtimeError ? (
            <Banner tone="error">
              Couldn&apos;t load connection setup. Retry to continue.
            </Banner>
          ) : null}

          {errorMessage ? <Banner tone="error">{errorMessage}</Banner> : null}
          {feedback ? <Banner tone="success">{feedback}</Banner> : null}

          {isLoading && !authOverview ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <LoaderCircleIcon className="size-4 animate-spin" />
                Loading providers
              </div>
            </div>
          ) : step === "providers" ? (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className={cn(
                    "group rounded-3xl border bg-card p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                    connectedProviderIds.has(resolveProviderConnectionId(provider))
                      ? "border-success/40"
                      : "border-border",
                  )}
                  onClick={() => {
                    setSelectedProviderId(provider.id);
                    setSelectedMethodId(provider.methods[0]?.id ?? null);
                    openedAuthLinkRef.current = null;
                    handledCompletedSessionRef.current = null;
                    setAuthSession(null);
                    setErrorMessage(null);
                    setFeedback(null);
                    setSecret("");
                    setSessionInputValue("");
                    setSessionSelections([]);
                    setModelCatalog(null);
                    setSelectedModelRef("");
                    setStep("configure");
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <ProviderMark provider={provider} />
                      <div>
                        <div className="text-2xl font-semibold tracking-tight text-foreground">
                          {formatProviderName(provider)}
                        </div>
                        {provider.description ? (
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {provider.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {connectedProviderIds.has(resolveProviderConnectionId(provider)) ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                        <CheckIcon className="size-3.5" />
                        Connected
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {provider.methods.map((method) => (
                      <span
                        key={method.id}
                        className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                      >
                        {method.label}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </section>
          ) : selectedProvider && selectedMethod ? (
            <section className="flex flex-1 flex-col">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <ProviderMark provider={selectedProvider} />
                  <div>
                    <div className="text-3xl font-semibold tracking-tight text-foreground">
                      {formatProviderName(selectedProvider)}
                    </div>
                    <p className="mt-2 text-base text-muted-foreground">
                      Choose the connection method you want to use.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedProvider.methods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      className={cn(
                        "rounded-full border px-5 py-3 text-base transition-colors",
                        method.id === selectedMethod.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                      onClick={() => {
                        setSelectedMethodId(method.id);
                        openedAuthLinkRef.current = null;
                        handledCompletedSessionRef.current = null;
                        setAuthSession(null);
                        setErrorMessage(null);
                        setFeedback(null);
                        setSecret("");
                        setSessionInputValue("");
                        setSessionSelections([]);
                        setModelCatalog(null);
                        setSelectedModelRef("");
                      }}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                {modelCatalog && modelCatalog.models.length > 0 ? (
                  <div className="max-w-xl space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Model
                    </label>
                    <select
                      className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-base text-foreground outline-none transition-colors focus:border-primary"
                      value={selectedModelRef}
                      onChange={(event) => {
                        setSelectedModelRef(event.target.value);
                      }}
                    >
                      {modelCatalog.models.map((model) => (
                        <option key={model.modelRef} value={model.modelRef}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm leading-6 text-muted-foreground">
                      CapyFin will use this model for {formatProviderName(selectedProvider)}.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-10 max-w-3xl">
                {selectedMethod.input === "api_key" || selectedMethod.input === "token" ? (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        {selectedMethod.label}
                      </h2>
                      <p className="text-base leading-7 text-muted-foreground">
                        {selectedMethod.hint ?? "Paste the credential you want CapyFin to use."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {selectedMethod.input === "token" ? "Token" : "API key"}
                      </label>
                      <Input
                        type="password"
                        value={secret}
                        placeholder={
                          selectedMethod.input === "token"
                            ? "Paste provider token"
                            : "Paste provider API key"
                        }
                        onChange={(event) => {
                          setSecret(event.target.value);
                        }}
                      />
                    </div>

                    <Button
                      type="button"
                      className="rounded-full px-5"
                      disabled={!client || !secret.trim() || isBusy}
                      onClick={() => {
                        void handleSecretConnect();
                      }}
                    >
                      {isBusy ? (
                        <>
                          <LoaderCircleIcon className="size-4 animate-spin" />
                          Connecting
                        </>
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        {selectedMethod.label}
                      </h2>
                      <p className="text-base leading-7 text-muted-foreground">
                        {selectedMethod.hint ??
                          "Continue the sign-in flow in the browser, then finish any remaining steps here."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        className="rounded-full px-5"
                        disabled={!client || isBusy}
                        onClick={() => {
                          void handleStartAuthSession();
                        }}
                      >
                        {isBusy ? (
                          <>
                            <LoaderCircleIcon className="size-4 animate-spin" />
                            Starting
                          </>
                        ) : (
                          <>
                            Start sign-in
                            <ExternalLinkIcon className="size-4" />
                          </>
                        )}
                      </Button>
                    </div>

                    {authSession ? (
                      <AuthSessionPanel
                        inputValue={sessionInputValue}
                        isBusy={isBusy}
                        session={authSession}
                        selections={sessionSelections}
                        setInputValue={setSessionInputValue}
                        setSelections={setSessionSelections}
                        onRespond={(value) => {
                          void handleRespondToSession(value);
                        }}
                      />
                    ) : null}
                  </div>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-8">
                <p className="text-sm text-muted-foreground">
                  Continue after one provider is connected and selected.
                </p>
                <Button
                  type="button"
                  className="rounded-full px-5"
                  disabled={!canContinue}
                  onClick={onContinue}
                >
                  Continue
                  <ArrowRightIcon className="size-4" />
                </Button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Banner({
  children,
  tone,
}: {
  children: string;
  tone: "error" | "success";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-4 text-sm",
        tone === "error"
          ? "border-warning/30 bg-warning/10 text-warning-foreground"
          : "border-success/30 bg-success/10 text-success",
      )}
    >
      {children}
    </div>
  );
}

function AuthSessionPanel({
  inputValue,
  isBusy,
  onRespond,
  selections,
  session,
  setInputValue,
  setSelections,
}: {
  inputValue: string;
  isBusy: boolean;
  onRespond: (value?: boolean | string | string[]) => void;
  selections: string[];
  session: AuthSession;
  setInputValue: (nextValue: string) => void;
  setSelections: (nextSelections: string[]) => void;
}) {
  const step = session.step;

  if (step.type === "working") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <LoaderCircleIcon className="size-4 animate-spin" />
        {step.message}
      </div>
    );
  }

  if (step.type === "completed") {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        {step.message ?? "Connection completed."}
      </div>
    );
  }

  if (step.type === "error") {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
        {step.message}
      </div>
    );
  }

  if (step.type === "auth_link") {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-4 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{step.label ?? "Browser sign-in ready"}</div>
        {step.instructions ? (
          <p className="mt-1 leading-6 text-muted-foreground">{step.instructions}</p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="mt-4 rounded-full"
          onClick={() => {
            void openExternalUrl(step.url);
          }}
        >
          Open sign-in page
          <ExternalLinkIcon className="size-4" />
        </Button>
      </div>
    );
  }

  if (step.type === "confirm_prompt") {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-4">
        <p className="text-sm leading-6 text-foreground">{step.message}</p>
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            className="rounded-full"
            disabled={isBusy}
            onClick={() => {
              onRespond(true);
            }}
          >
            {step.confirmLabel ?? "Continue"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={isBusy}
            onClick={() => {
              onRespond(false);
            }}
          >
            {step.cancelLabel ?? "Not now"}
          </Button>
        </div>
      </div>
    );
  }

  if (step.type === "text_prompt") {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-4">
        <label className="block text-sm font-medium text-foreground">{step.message}</label>
        <Input
          type={step.secret ? "password" : "text"}
          className="mt-3"
          value={inputValue}
          placeholder={step.placeholder}
          onChange={(event) => {
            setInputValue(event.target.value);
          }}
        />
        <Button
          type="button"
          className="mt-4 rounded-full"
          disabled={isBusy || (!step.allowEmpty && !inputValue.trim())}
          onClick={() => {
            onRespond(inputValue);
          }}
        >
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4">
      <p className="text-sm font-medium text-foreground">{step.message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {step.options.map((option) => {
          const isSelected = selections.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "rounded-full border px-3 py-2 text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
              onClick={() => {
                if (step.allowMultiple) {
                  setSelections(
                    isSelected
                      ? selections.filter((value) => value !== option.value)
                      : [...selections, option.value],
                  );
                  return;
                }
                setSelections([option.value]);
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        className="mt-4 rounded-full"
        disabled={isBusy || selections.length === 0}
        onClick={() => {
          onRespond(step.allowMultiple ? selections : selections[0] ?? "");
        }}
      >
        Continue
      </Button>
    </div>
  );
}

function ProviderMark({ provider }: { provider: ProviderDefinition }) {
  const logo = providerLogos[provider.id];

  if (!logo) {
    return (
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted text-lg font-semibold text-foreground">
        {provider.name.charAt(0)}
      </div>
    );
  }

  return (
    <div
      className="provider-mark flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm [&_svg]:size-7"
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: logo.svg.replace(
          "<svg ",
          `<svg fill="var(--provider-mark-color, ${logo.color})" style="--provider-mark-dark-color: ${logo.darkColor ?? logo.color}" `,
        ),
      }}
    />
  );
}

function resolveProviderConnectionId(provider: ProviderDefinition): string {
  return provider.methods[0]?.providerId ?? provider.id;
}

function formatProviderName(provider: ProviderDefinition): string {
  if (provider.id === "copilot") {
    return "GitHub Copilot";
  }
  return provider.name;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

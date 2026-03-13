import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckIcon,
  ExternalLinkIcon,
  LoaderCircleIcon,
  RefreshCcwIcon,
  Trash2Icon,
} from "lucide-react";
import type { AuthOverview, OAuthSession, StoredProfileSummary } from "@/app/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { openExternalUrl } from "@/lib/platform/open-external-url";
import { SidecarClient } from "@/lib/sidecar/client";
import {
  buildProviderFamilies,
  type ProviderFamilyOption,
} from "@/features/onboarding/provider-families";
import {
  getOAuthAutomationResponse,
  isGitHubEnterprisePrompt,
  shouldAutoSubmitOAuthPrompt,
  type PendingOAuthAutomation,
} from "@/features/onboarding/oauth-flow";
import { resolvePreferredOptionKey } from "@/features/onboarding/selection";

interface ConnectionsWorkspaceProps {
  addRequestToken: number;
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
  onAuthOverviewChange: (nextOverview: AuthOverview) => void;
}

type ConnectionsMode = "list" | "add";

export function ConnectionsWorkspace({
  addRequestToken,
  authOverview,
  client,
  onAuthOverviewChange,
}: ConnectionsWorkspaceProps) {
  const providerFamilies = useMemo(
    () => buildProviderFamilies(authOverview),
    [authOverview],
  );
  const storedConnections = useMemo(
    () =>
      (authOverview?.providers ?? [])
        .flatMap((providerStatus) =>
          providerStatus.profiles.map((profile) => ({
            profile,
            providerId: providerStatus.provider.id,
            providerName: providerStatus.provider.name,
            providerStatus,
          })),
        )
        .sort((left, right) => {
          if (left.profile.isActiveProfile !== right.profile.isActiveProfile) {
            return left.profile.isActiveProfile ? -1 : 1;
          }

          return right.profile.updatedAt.localeCompare(left.profile.updatedAt);
        }),
    [authOverview],
  );
  const [mode, setMode] = useState<ConnectionsMode>("list");
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const [oauthSession, setOAuthSession] = useState<OAuthSession | null>(null);
  const [pendingOAuthAutomation, setPendingOAuthAutomation] =
    useState<PendingOAuthAutomation | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const openedLinksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (addRequestToken === 0) {
      return;
    }

    setMode("add");
    setFeedback(null);
    setErrorMessage(null);
  }, [addRequestToken]);

  useEffect(() => {
    if (providerFamilies.length === 0) {
      setSelectedFamilyId(null);
      setSelectedOptionKey(null);
      return;
    }

    const nextFamily =
      providerFamilies.find((family) => family.id === selectedFamilyId) ??
      providerFamilies[0];

    if (!nextFamily) {
      return;
    }

    if (!selectedFamilyId || !providerFamilies.some((family) => family.id === selectedFamilyId)) {
      setSelectedFamilyId(nextFamily.id);
    }
  }, [providerFamilies, selectedFamilyId]);

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
      setSelectedOptionKey(
        resolvePreferredOptionKey(selectedFamily, authOverview) ??
          selectedFamily.options[0]?.key ??
          null,
      );
    }
  }, [authOverview, selectedFamily, selectedOptionKey]);

  useEffect(() => {
    if (!client || oauthSession?.state !== "pending") {
      return;
    }

    let cancelled = false;

    const syncSession = async (): Promise<void> => {
      try {
        let nextSession = await client.getOAuthSession(oauthSession.id);
        if (cancelled) {
          return;
        }

        if (shouldAutoSubmitOAuthPrompt(nextSession, pendingOAuthAutomation)) {
          nextSession = await client.submitOAuthSessionPrompt(
            nextSession.id,
            pendingOAuthAutomation.response,
          );
          setPendingOAuthAutomation(null);
        }

        setOAuthSession(nextSession);
        if (nextSession.authUrl) {
          void openSessionLink(nextSession.authUrl, openedLinksRef.current);
        }

        if (nextSession.state === "completed") {
          setFeedback(`Connected ${nextSession.providerName}.`);
          setMode("list");
          setPromptValue("");
          setPendingOAuthAutomation(null);
          const nextOverview = await client.authOverview();
          onAuthOverviewChange(nextOverview);
        }

        if (nextSession.state === "error") {
          setPendingOAuthAutomation(null);
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
  }, [client, oauthSession, onAuthOverviewChange, pendingOAuthAutomation]);

  const selectedOption =
    selectedFamily?.options.find((option) => option.key === selectedOptionKey) ??
    selectedFamily?.options[0] ??
    null;

  async function refreshOverview(): Promise<void> {
    if (!client) {
      return;
    }

    const nextOverview = await client.authOverview();
    onAuthOverviewChange(nextOverview);
  }

  async function handleSelectDefault(profileId: string): Promise<void> {
    if (!client) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      await client.selectProvider(profileId);
      const nextOverview = await client.authOverview();
      onAuthOverviewChange(nextOverview);
      setFeedback("Default connection updated.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete(profileId: string): Promise<void> {
    if (!client) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      await client.deleteAuthProfile(profileId);
      const nextOverview = await client.authOverview();
      onAuthOverviewChange(nextOverview);
      setFeedback("Connection removed.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
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
      setMode("list");
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
      setMode("list");
      setFeedback(`Connected ${selectedFamily?.title ?? "provider"}.`);
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
      setErrorMessage("Secure sign-in is temporarily unavailable.");
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsBusy(true);

    try {
      const automationResponse = getOAuthAutomationResponse(
        selectedOption.oauthExperience,
        promptValue,
      );
      let session = await client.startOAuthSession({
        label: "default",
        providerId: selectedOption.providerId,
      });

      if (automationResponse !== null) {
        setPendingOAuthAutomation({
          response: automationResponse,
          sessionId: session.id,
        });
      } else {
        setPendingOAuthAutomation(null);
      }

      if (
        automationResponse !== null &&
        isGitHubEnterprisePrompt(session.step)
      ) {
        session = await client.submitOAuthSessionPrompt(
          session.id,
          automationResponse,
        );
        setPendingOAuthAutomation(null);
      }

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
      setPendingOAuthAutomation(null);
      setPromptValue("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {errorMessage ? (
        <MessageBanner tone="error">{errorMessage}</MessageBanner>
      ) : null}

      {feedback ? (
        <MessageBanner tone="success">{feedback}</MessageBanner>
      ) : null}

      {mode === "add" ? (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Add connection
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose a provider, then connect it with the simplest method that fits.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                startTransition(() => {
                  setMode("list");
                  setOAuthSession(null);
                  setPendingOAuthAutomation(null);
                  setPromptValue("");
                  setSecret("");
                });
              }}
            >
              Cancel
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {providerFamilies.map((family) => (
              <button
                key={family.id}
                type="button"
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  family.id === selectedFamily?.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted",
                )}
                onClick={() => {
                  setSelectedFamilyId(family.id);
                  setSelectedOptionKey(
                    resolvePreferredOptionKey(family, authOverview) ??
                      family.options[0]?.key ??
                      null,
                  );
                  setSecret("");
                  setPromptValue("");
                  setOAuthSession(null);
                  setPendingOAuthAutomation(null);
                  setErrorMessage(null);
                  setFeedback(null);
                }}
              >
                {family.title}
              </button>
            ))}
          </div>

          {selectedFamily && selectedOption ? (
            <div className="space-y-6 border-t border-border/70 pt-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  {selectedFamily.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedFamily.description}
                </p>
              </div>

              {selectedFamily.options.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedFamily.options.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition-colors",
                        option.key === selectedOption.key
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      )}
                      onClick={() => {
                        setSelectedOptionKey(option.key);
                        setSecret("");
                        setPromptValue("");
                        setOAuthSession(null);
                        setPendingOAuthAutomation(null);
                        setErrorMessage(null);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <ConnectionMethodPanel
                client={client}
                isBusy={isBusy}
                oauthSession={oauthSession}
                option={selectedOption}
                promptValue={promptValue}
                secret={secret}
                onEnvironmentSelect={() => {
                  void handleEnvironmentSelection();
                }}
                onSecretConnect={() => {
                  void handleSecretConnect();
                }}
                onOauthPromptSubmit={() => {
                  void handleOAuthPromptSubmit();
                }}
                onOauthStart={() => {
                  void handleOAuthStart();
                }}
                onOpenLinkAgain={() => {
                  const url =
                    oauthSession?.authUrl ??
                    (oauthSession?.step.type === "auth_link"
                      ? oauthSession.step.url
                      : null);
                  if (!url) {
                    return;
                  }

                  void openSessionLink(url, openedLinksRef.current, true);
                }}
                onPromptChange={setPromptValue}
                onSecretChange={setSecret}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Current connections
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick the default connection the app should use, or remove old ones.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={!client || isBusy}
            onClick={() => {
              void refreshOverview();
            }}
          >
            <RefreshCcwIcon className="size-4" />
            Refresh
          </Button>
        </div>

        {storedConnections.length === 0 ? (
          <div className="border-t border-border/70 py-8 text-sm text-muted-foreground">
            No saved connections yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Connection</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storedConnections.map((connection) => (
                  <ConnectionRow
                    key={connection.profile.profileId}
                    connection={connection}
                    isBusy={isBusy}
                    onDelete={handleDelete}
                    onSelectDefault={handleSelectDefault}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function ConnectionRow({
  connection,
  isBusy,
  onDelete,
  onSelectDefault,
}: {
  connection: {
    profile: StoredProfileSummary;
    providerId: string;
    providerName: string;
  };
  isBusy: boolean;
  onDelete: (profileId: string) => Promise<void>;
  onSelectDefault: (profileId: string) => Promise<void>;
}) {
  const isDefault = connection.profile.isActiveProfile;

  return (
    <TableRow>
      <TableCell className="font-medium">{connection.providerName}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{connection.profile.label}</span>
          {isDefault ? <Badge variant="secondary">Default</Badge> : null}
        </div>
      </TableCell>
      <TableCell>{formatCredentialType(connection.profile.type)}</TableCell>
      <TableCell>{formatDate(connection.profile.updatedAt)}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={isBusy || isDefault}
            onClick={() => {
              void onSelectDefault(connection.profile.profileId);
            }}
          >
            <CheckIcon className="size-4" />
            Make default
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={isBusy}
            onClick={() => {
              void onDelete(connection.profile.profileId);
            }}
          >
            <Trash2Icon className="size-4" />
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ConnectionMethodPanel({
  client,
  isBusy,
  oauthSession,
  option,
  promptValue,
  secret,
  onEnvironmentSelect,
  onSecretConnect,
  onOauthPromptSubmit,
  onOauthStart,
  onOpenLinkAgain,
  onPromptChange,
  onSecretChange,
}: {
  client: SidecarClient | null;
  isBusy: boolean;
  oauthSession: OAuthSession | null;
  option: ProviderFamilyOption;
  promptValue: string;
  secret: string;
  onEnvironmentSelect: () => void;
  onSecretConnect: () => void;
  onOauthPromptSubmit: () => void;
  onOauthStart: () => void;
  onOpenLinkAgain: () => void;
  onPromptChange: (value: string) => void;
  onSecretChange: (value: string) => void;
}) {
  const promptStep = getPromptStep(oauthSession);
  const oauthLinkUrl =
    oauthSession?.authUrl ??
    (oauthSession?.step.type === "auth_link" ? oauthSession.step.url : null);

  if (option.mode === "api_key" || option.mode === "token") {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-sm text-muted-foreground">{option.description}</p>
        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {option.mode === "token" ? "Token" : "API key"}
          </span>
          <Input
            value={secret}
            onChange={(event) => {
              onSecretChange(event.target.value);
            }}
            placeholder={
              option.mode === "token" ? "Paste provider token" : "Paste provider API key"
            }
            type="password"
          />
        </label>
        <Button
          type="button"
          className="rounded-full"
          disabled={!client || !secret.trim() || isBusy}
          onClick={onSecretConnect}
        >
          Connect
        </Button>
      </div>
    );
  }

  if (option.mode === "application_default" || option.mode === "aws_sdk") {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-sm text-muted-foreground">{option.description}</p>
        <Button
          type="button"
          className="rounded-full"
          disabled={!client || isBusy || !option.providerStatus?.environment.available}
          onClick={onEnvironmentSelect}
        >
          Use this connection
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted-foreground">{option.description}</p>

      {option.oauthExperience === "github-enterprise" ? (
        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            GitHub Enterprise domain
          </span>
          <Input
            value={promptValue}
            onChange={(event) => {
              onPromptChange(event.target.value);
            }}
            placeholder="company.ghe.com"
          />
        </label>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className="rounded-full"
          disabled={
            !client ||
            isBusy ||
            (option.oauthExperience === "github-enterprise" &&
              promptValue.trim().length === 0)
          }
          onClick={onOauthStart}
        >
          {isBusy ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <ExternalLinkIcon className="size-4" />
          )}
          {option.label}
        </Button>

        {oauthLinkUrl ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onOpenLinkAgain}
          >
            Open link again
          </Button>
        ) : null}
      </div>

      {oauthSession ? (
        <p className="text-sm text-muted-foreground">
          {renderOAuthSessionMessage(oauthSession)}
        </p>
      ) : null}

      {promptStep ? (
        <div className="flex max-w-2xl flex-col gap-3">
          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Continue sign-in
            </span>
            <Input
              value={promptValue}
              onChange={(event) => {
                onPromptChange(event.target.value);
              }}
              placeholder={promptStep.placeholder ?? "Continue here"}
            />
          </label>
          <Button
            type="button"
            className="w-fit rounded-full"
            disabled={isBusy || (!promptStep.allowEmpty && !promptValue.trim())}
            onClick={onOauthPromptSubmit}
          >
            Continue
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function MessageBanner({
  children,
  tone,
}: {
  children: string;
  tone: "error" | "success";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "error"
          ? "border-amber-300/80 bg-amber-50 text-amber-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900",
      )}
    >
      {children}
    </div>
  );
}

function formatCredentialType(type: StoredProfileSummary["type"]): string {
  switch (type) {
    case "api_key":
      return "API key";
    case "token":
      return "Token";
    case "oauth":
      return "Sign-in";
    default:
      return type;
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getPromptStep(session: OAuthSession | null) {
  return session?.step.type === "prompt" ? session.step : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function renderOAuthSessionMessage(session: OAuthSession): string {
  if (session.error) {
    return session.error;
  }

  switch (session.step.type) {
    case "working":
      return session.step.message;
    case "auth_link":
      return session.step.instructions ?? "Continue sign-in in the browser.";
    case "prompt":
      return session.step.message;
    case "completed":
      return "Connection complete.";
    case "error":
      return session.step.message;
    default:
      return "Continue sign-in in the browser.";
  }
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

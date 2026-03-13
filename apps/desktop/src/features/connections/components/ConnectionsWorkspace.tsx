import { useMemo, useState } from "react";
import { CheckIcon, RefreshCcwIcon, Trash2Icon } from "lucide-react";
import type { AuthOverview, StoredProfileSummary } from "@/app/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SidecarClient } from "@/lib/sidecar/client";

interface ConnectionsWorkspaceProps {
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
  onAuthOverviewChange: (nextOverview: AuthOverview) => void;
}

export function ConnectionsWorkspace({
  authOverview,
  client,
  onAuthOverviewChange,
}: ConnectionsWorkspaceProps) {
  const storedConnections = useMemo(
    () =>
      (authOverview?.providers ?? [])
        .flatMap((providerStatus) =>
          providerStatus.profiles.map((profile) => ({
            modelLabel: resolveActiveModelLabel(providerStatus.provider.id),
            profile,
            providerId: providerStatus.provider.id,
            providerName: resolveConnectionProviderName(
              providerStatus.provider.id,
              providerStatus.provider.name,
            ),
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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

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
      await refreshOverview();
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
      await refreshOverview();
      setFeedback("Connection removed.");
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
                  <TableHead>Model</TableHead>
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
    modelLabel: string;
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
      <TableCell>{connection.modelLabel}</TableCell>
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function resolveConnectionProviderName(
  providerId: string,
  fallbackName: string,
): string {
  if (providerId === "openai-codex") {
    return "ChatGPT (Codex)";
  }

  return fallbackName;
}

function resolveActiveModelLabel(providerId: string): string {
  switch (providerId) {
    case "anthropic":
      return "claude-sonnet-4-5";
    case "google":
    case "google-antigravity":
    case "google-gemini-cli":
    case "google-vertex":
      return "gemini-2.5-pro";
    case "openai":
    case "openai-codex":
    case "azure-openai-responses":
    case "github-copilot":
      return "gpt-5";
    default:
      return "provider default";
  }
}

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
    <div className="flex flex-1 flex-col gap-5">
      {errorMessage ? (
        <MessageBanner tone="error">{errorMessage}</MessageBanner>
      ) : null}

      {feedback ? (
        <MessageBanner tone="success">{feedback}</MessageBanner>
      ) : null}

      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Current connections
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Pick the default connection the app should use, or remove old ones.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!client || isBusy}
            onClick={() => {
              void refreshOverview();
            }}
          >
            <RefreshCcwIcon className="size-3.5" />
            Refresh
          </Button>
        </div>

        {storedConnections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            No saved connections yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Provider
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Connection
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Model
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Updated
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Actions
                  </TableHead>
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
    <TableRow className="border-border transition-colors hover:bg-muted/30">
      <TableCell className="text-[13px] font-medium">{connection.providerName}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-[13px]">{connection.profile.label}</span>
          {isDefault ? (
            <Badge
              variant="secondary"
              className="rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
            >
              Default
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-[13px] text-muted-foreground">{connection.modelLabel}</TableCell>
      <TableCell className="text-[13px] text-muted-foreground">{formatDate(connection.profile.updatedAt)}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs"
            disabled={isBusy || isDefault}
            onClick={() => {
              void onSelectDefault(connection.profile.profileId);
            }}
          >
            <CheckIcon className="size-3.5" />
            Make default
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isBusy}
            onClick={() => {
              void onDelete(connection.profile.profileId);
            }}
          >
            <Trash2Icon className="size-3.5" />
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
          ? "border-warning/30 bg-warning/10 text-warning-foreground"
          : "border-success/30 bg-success/10 text-success",
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

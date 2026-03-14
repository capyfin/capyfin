import { useMemo, useState } from "react";
import { CheckIcon, RefreshCcwIcon, Trash2Icon } from "lucide-react";
import type { AuthOverview, SavedConnection } from "@/app/types";
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
    () => authOverview?.connections ?? [],
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
      await client.selectConnection(profileId);
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
                    key={connection.profileId}
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
  connection: SavedConnection;
  isBusy: boolean;
  onDelete: (profileId: string) => Promise<void>;
  onSelectDefault: (profileId: string) => Promise<void>;
}) {
  return (
    <TableRow className="border-border transition-colors hover:bg-muted/30">
      <TableCell className="text-[13px] font-medium">{connection.providerName}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-[13px]">{connection.label}</span>
          {connection.isDefault ? (
            <Badge
              variant="secondary"
              className="rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
            >
              Default
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-[13px] text-muted-foreground">
        {connection.activeModelId ?? "Provider default"}
      </TableCell>
      <TableCell className="text-[13px] text-muted-foreground">
        {formatDate(connection.updatedAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs"
            disabled={isBusy || connection.isDefault}
            onClick={() => {
              void onSelectDefault(connection.profileId);
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
              void onDelete(connection.profileId);
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

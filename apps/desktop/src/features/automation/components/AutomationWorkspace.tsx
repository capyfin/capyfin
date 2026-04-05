import type { Automation } from "@capyfin/contracts";
import { LoaderCircleIcon, PlusIcon, ZapIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SidecarClient } from "@/lib/sidecar/client";
import { AutomationDialog } from "./AutomationDialog";
import { AutomationEmptyState } from "./AutomationEmptyState";
import { AutomationList } from "./AutomationList";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { RunHistoryPanel } from "./RunHistoryPanel";

export const AUTOMATION_EMPTY_TEXT =
  "No automations configured. Schedule recurring research and delivery workflows here.";

type FilterValue = "all" | "active" | "paused";

interface AutomationWorkspaceProps {
  client: SidecarClient | null;
}

export function AutomationWorkspace({ client }: AutomationWorkspaceProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Automation | undefined>(
    undefined,
  );
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [runsTarget, setRunsTarget] = useState<Automation | null>(null);

  const fetchAutomations = useCallback(async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await client.listAutomations();
      setAutomations(result.automations);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load automations",
      );
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchAutomations();
  }, [fetchAutomations]);

  const handleToggle = useCallback(
    async (automation: Automation) => {
      if (!client) return;
      try {
        const updated = await client.updateAutomation(automation.id, {
          enabled: !automation.enabled,
        });
        setAutomations((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a)),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update automation",
        );
      }
    },
    [client],
  );

  const handleSave = useCallback(() => {
    setShowCreateDialog(false);
    setEditTarget(undefined);
    void fetchAutomations();
  }, [fetchAutomations]);

  const handleDelete = useCallback(async () => {
    if (!client || !deleteTarget) return;
    try {
      setIsDeleting(true);
      await client.deleteAutomation(deleteTarget.id);
      setDeleteTarget(null);
      void fetchAutomations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete automation",
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }, [client, deleteTarget, fetchAutomations]);

  if (!client) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Waiting for connection...
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const filteredAutomations =
    filter === "all"
      ? automations
      : automations.filter((a) =>
          filter === "active" ? a.enabled : !a.enabled,
        );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5">
      {/* Page header with gradient hero */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-amber-500/[0.05] via-background to-primary/[0.03] px-5 py-4 dark:from-amber-500/[0.10] dark:to-primary/[0.05]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/[0.08] ring-1 ring-amber-500/10">
              <ZapIcon className="size-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
                Automation
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Schedule recurring research and delivery workflows.
              </p>
            </div>
          </div>
          {automations.length > 0 ? (
            <Button
              size="sm"
              onClick={() => {
                setShowCreateDialog(true);
              }}
            >
              <PlusIcon className="size-3.5" />
              New Automation
            </Button>
          ) : null}
        </div>
      </div>

      {automations.length === 0 ? (
        <AutomationEmptyState
          onCreate={() => {
            setShowCreateDialog(true);
          }}
        />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={filter}
              onValueChange={(v: string) => {
                if (v) setFilter(v as FilterValue);
              }}
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="active">Active</ToggleGroupItem>
              <ToggleGroupItem value="paused">Paused</ToggleGroupItem>
            </ToggleGroup>
            <span className="text-[12px] text-muted-foreground/50">
              {filteredAutomations.length}{" "}
              {filteredAutomations.length === 1 ? "automation" : "automations"}
            </span>
          </div>

          <AutomationList
            automations={filteredAutomations}
            onToggle={(a) => {
              void handleToggle(a);
            }}
            onEdit={(a) => {
              setEditTarget(a);
            }}
            onDelete={(a) => {
              setDeleteTarget(a);
            }}
            onViewRuns={(a) => {
              setRunsTarget(a);
            }}
          />
        </>
      )}

      <AutomationDialog
        client={client}
        open={showCreateDialog || editTarget !== undefined}
        onClose={() => {
          setShowCreateDialog(false);
          setEditTarget(undefined);
        }}
        onSave={handleSave}
        editAutomation={editTarget}
      />

      <DeleteConfirmDialog
        name={deleteTarget?.cardTitle ?? null}
        open={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
        isDeleting={isDeleting}
      />

      <RunHistoryPanel
        automationId={runsTarget?.id ?? null}
        automationName={runsTarget?.cardTitle ?? null}
        open={runsTarget !== null}
        onClose={() => {
          setRunsTarget(null);
        }}
        client={client}
      />
    </div>
  );
}

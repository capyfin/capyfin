import type { InvestmentCase, WatchlistItem } from "@capyfin/contracts";
import {
  ListChecksIcon,
  LoaderCircleIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { buildCaseMap, getCaseStatus } from "@/features/launchpad/case-lookup";
import type { ActionCard } from "@/features/launchpad/types";
import type { SidecarClient } from "@/lib/sidecar/client";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { WatchlistEmptyState } from "./WatchlistEmptyState";
import { WatchlistItemDialog } from "./WatchlistItemDialog";
import type { SortColumn, SortDirection } from "./WatchlistTable";
import { WatchlistTable } from "./WatchlistTable";
import { getFilterGuidance } from "./watchlist-guidance";

export const WATCHLIST_EMPTY_TEXT =
  "Your watchlist is empty. Add tickers and assets to track them here.";

export const WATCHLIST_NEAR_EMPTY_TEXT =
  "Add more tickers to build your watchlist — track price moves, run analyses, and set up alerts.";

export const WATCHLIST_NEAR_EMPTY_THRESHOLD = 5;

type FilterValue =
  | "all"
  | "position"
  | "watching"
  | "needs-review"
  | "catalyst-soon"
  | "no-case";

interface WatchlistWorkspaceProps {
  client: SidecarClient | null;
  onCardAction?: ((card: ActionCard, ticker: string) => void) | undefined;
  onViewCase?: ((caseId: string) => void) | undefined;
  onCreateCase?: ((ticker: string) => void) | undefined;
  onRefreshCase?: ((ticker: string) => void) | undefined;
}

export function WatchlistWorkspace({
  client,
  onCardAction,
  onViewCase,
  onCreateCase,
  onRefreshCase,
}: WatchlistWorkspaceProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [cases, setCases] = useState<InvestmentCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sortBy, setSortBy] = useState<SortColumn>("addedAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editItem, setEditItem] = useState<WatchlistItem | undefined>(
    undefined,
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      setError(null);
      const [watchlistResult, casesResult] = await Promise.allSettled([
        client.getWatchlist(),
        client.listCases(),
      ]);
      if (watchlistResult.status === "fulfilled") {
        setItems(watchlistResult.value.items);
      } else {
        setError("Failed to load watchlist");
      }
      if (casesResult.status === "fulfilled") {
        setCases(casesResult.value.cases);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load watchlist");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchWatchlist();
  }, [fetchWatchlist]);

  const handleSort = useCallback(
    (col: SortColumn) => {
      if (col === sortBy) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(col);
        setSortDir(col === "ticker" ? "asc" : "desc");
      }
    },
    [sortBy],
  );

  const handleSave = useCallback(() => {
    setShowAddDialog(false);
    setEditItem(undefined);
    void fetchWatchlist();
  }, [fetchWatchlist]);

  const handleDelete = useCallback(async () => {
    if (!client || !deleteTarget) return;
    try {
      setIsDeleting(true);
      await client.removeWatchlistItem(deleteTarget);
      setDeleteTarget(null);
      void fetchWatchlist();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete watchlist item",
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }, [client, deleteTarget, fetchWatchlist]);

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

  const caseMap = buildCaseMap(cases);

  const filteredItems = (() => {
    if (filter === "all") return items;
    if (filter === "position" || filter === "watching")
      return items.filter((i) => i.list === filter);
    if (filter === "needs-review")
      return items.filter((i) => {
        const status = getCaseStatus(i.ticker, caseMap);
        if (!status.hasCase) return true;
        const a = status.attentionState;
        return (
          a === "review-soon" ||
          a === "review-now" ||
          a === "stale" ||
          status.isStale ||
          status.isLowConfidence
        );
      });
    if (filter === "catalyst-soon")
      return items.filter((i) => {
        const status = getCaseStatus(i.ticker, caseMap);
        if (!status.nextCatalystDate) return false;
        const diffMs = new Date(status.nextCatalystDate).getTime() - Date.now();
        const daysUntil = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 14;
      });
    // no-case
    return items.filter((i) => {
      const status = getCaseStatus(i.ticker, caseMap);
      return !status.hasCase;
    });
  })();

  const sortedItems = [...filteredItems].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortBy === "ticker") {
      return mul * a.ticker.localeCompare(b.ticker);
    }
    return (
      mul * (new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime())
    );
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
      {items.length === 0 ? (
        <WatchlistEmptyState
          onAdd={() => {
            setShowAddDialog(true);
          }}
        />
      ) : (
        <>
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-blue-500/[0.05] via-background to-primary/[0.03] px-5 py-4 dark:from-blue-500/[0.10] dark:to-primary/[0.05]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/[0.08] text-blue-500 ring-1 ring-blue-500/10">
                  <ListChecksIcon className="size-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold tracking-tight">
                    Watchlist
                  </h2>
                  <p className="text-[13px] text-muted-foreground">
                    {items.length} {items.length === 1 ? "ticker" : "tickers"}{" "}
                    tracked
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setShowAddDialog(true);
                }}
              >
                <PlusIcon className="size-3.5" />
                Add Ticker
              </Button>
            </div>

            <div className="mt-3 flex items-center">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={filter}
                onValueChange={(v: string) => {
                  if (v) setFilter(v as FilterValue);
                }}
              >
                <ToggleGroupItem
                  value="all"
                  className="border-border/40 bg-background/50 backdrop-blur-sm transition-all hover:border-border hover:bg-background/80"
                >
                  All
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="position"
                  className="border-border/40 bg-background/50 backdrop-blur-sm transition-all hover:border-border hover:bg-background/80"
                >
                  Positions
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="watching"
                  className="border-border/40 bg-background/50 backdrop-blur-sm transition-all hover:border-border hover:bg-background/80"
                >
                  Watching
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="needs-review"
                  className="border-border/40 bg-background/50 backdrop-blur-sm transition-all hover:border-border hover:bg-background/80"
                >
                  Needs Review
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="catalyst-soon"
                  className="border-border/40 bg-background/50 backdrop-blur-sm transition-all hover:border-border hover:bg-background/80"
                >
                  Catalyst Soon
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="no-case"
                  className="border-border/40 bg-background/50 backdrop-blur-sm transition-all hover:border-border hover:bg-background/80"
                >
                  No Case
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <WatchlistTable
            items={sortedItems}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            onEdit={(item) => {
              setEditItem(item);
            }}
            onDelete={(ticker) => {
              setDeleteTarget(ticker);
            }}
            onCardAction={onCardAction}
            caseMap={caseMap}
            onViewCase={onViewCase}
            onCreateCase={onCreateCase}
            onRefreshCase={onRefreshCase}
          />

          {(() => {
            const guidance = getFilterGuidance(
              filter,
              filteredItems.length,
              items.length,
            );
            return guidance ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/50 bg-muted/[0.02] px-5 py-4 dark:bg-muted/[0.04]">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/[0.06]">
                  <SparklesIcon className="size-3.5 text-blue-500/60" />
                </div>
                <p className="text-[13px] text-muted-foreground/60">
                  {guidance}
                </p>
              </div>
            ) : null;
          })()}
        </>
      )}

      <WatchlistItemDialog
        client={client}
        open={showAddDialog || editItem !== undefined}
        onClose={() => {
          setShowAddDialog(false);
          setEditItem(undefined);
        }}
        onSave={handleSave}
        editItem={editItem}
      />

      <DeleteConfirmDialog
        ticker={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
        isDeleting={isDeleting}
      />
    </div>
  );
}

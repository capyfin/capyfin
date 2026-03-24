import type { WatchlistItem } from "@capyfin/contracts";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SidecarClient } from "@/lib/sidecar/client";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { WatchlistEmptyState } from "./WatchlistEmptyState";
import { WatchlistItemDialog } from "./WatchlistItemDialog";
import type { SortColumn, SortDirection } from "./WatchlistTable";
import { WatchlistTable } from "./WatchlistTable";

export const WATCHLIST_EMPTY_TEXT =
  "Your watchlist is empty. Add tickers and assets to track them here.";

export const WATCHLIST_NEAR_EMPTY_TEXT =
  "Add more tickers to build your watchlist — track price moves, run analyses, and set up alerts.";

export const WATCHLIST_NEAR_EMPTY_THRESHOLD = 5;

type FilterValue = "all" | "position" | "watching";

interface WatchlistWorkspaceProps {
  client: SidecarClient | null;
}

export function WatchlistWorkspace({ client }: WatchlistWorkspaceProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
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
      const result = await client.getWatchlist();
      setItems(result.items);
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

  const filteredItems =
    filter === "all" ? items : items.filter((i) => i.list === filter);

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
          <div className="flex items-center justify-between">
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
              <ToggleGroupItem value="position">Positions</ToggleGroupItem>
              <ToggleGroupItem value="watching">Watching</ToggleGroupItem>
            </ToggleGroup>

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
          />

          {items.length < WATCHLIST_NEAR_EMPTY_THRESHOLD && (
            <p className="text-center text-sm text-muted-foreground py-8">
              {WATCHLIST_NEAR_EMPTY_TEXT}
            </p>
          )}
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

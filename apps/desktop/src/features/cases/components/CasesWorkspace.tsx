import type { InvestmentCase } from "@capyfin/contracts";
import { GitCompareArrowsIcon, LoaderCircleIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SidecarClient } from "@/lib/sidecar/client";
import { CaseCard } from "./CaseCard";
import { CasesEmptyState } from "./CasesEmptyState";

export type CasesSortBy = "lastReviewed" | "confidence" | "ticker";

const CONFIDENCE_ORDER = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;

interface CasesWorkspaceProps {
  client: SidecarClient | null;
}

export function CasesWorkspace({ client }: CasesWorkspaceProps) {
  const [cases, setCases] = useState<InvestmentCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<CasesSortBy>("lastReviewed");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchCases = useCallback(async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await client.listCases();
      setCases(result.cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchCases();
  }, [fetchCases]);

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

  const sortedCases = [...cases].sort((a, b) => {
    if (sortBy === "ticker") {
      return a.ticker.localeCompare(b.ticker);
    }
    if (sortBy === "confidence") {
      return CONFIDENCE_ORDER[b.confidence] - CONFIDENCE_ORDER[a.confidence];
    }
    return (
      new Date(b.lastReviewedAt).getTime() -
      new Date(a.lastReviewedAt).getTime()
    );
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
      {cases.length === 0 ? (
        <CasesEmptyState
          onDeepDive={() => {
            window.location.hash = "#launchpad";
          }}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Investment Cases</h2>
            <div className="flex items-center gap-2">
              {compareMode && selectedIds.length === 2 ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const [left, right] = selectedIds;
                    window.location.hash = `#cases/compare?left=${String(left)}&right=${String(right)}`;
                  }}
                >
                  <GitCompareArrowsIcon className="size-3.5" />
                  Compare Selected
                </Button>
              ) : null}
              <Button
                variant={compareMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setCompareMode((prev) => !prev);
                  setSelectedIds([]);
                }}
              >
                <GitCompareArrowsIcon className="size-3.5" />
                {compareMode ? "Cancel" : "Compare"}
              </Button>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={sortBy}
                onValueChange={(v: string) => {
                  if (v) setSortBy(v as CasesSortBy);
                }}
              >
                <ToggleGroupItem value="lastReviewed">Recent</ToggleGroupItem>
                <ToggleGroupItem value="confidence">Confidence</ToggleGroupItem>
                <ToggleGroupItem value="ticker">A-Z</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {compareMode ? (
            <p className="text-xs text-muted-foreground">
              Select exactly 2 cases to compare them side by side.
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            {sortedCases.map((c) => (
              <CaseCard
                key={c.id}
                investmentCase={c}
                selected={compareMode ? selectedIds.includes(c.id) : undefined}
                onClick={() => {
                  if (compareMode) {
                    setSelectedIds((prev) => {
                      if (prev.includes(c.id)) {
                        return prev.filter((id) => id !== c.id);
                      }
                      if (prev.length >= 2) return prev;
                      return [...prev, c.id];
                    });
                  } else {
                    window.location.hash = `#cases/${c.id}`;
                  }
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

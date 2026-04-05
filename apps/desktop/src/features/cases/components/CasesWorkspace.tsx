import type {
  InvestmentCase,
  PortfolioOverview,
  WatchlistItem,
} from "@capyfin/contracts";
import {
  BriefcaseIcon,
  GitCompareArrowsIcon,
  LoaderCircleIcon,
  SparklesIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SidecarClient } from "@/lib/sidecar/client";
import {
  CASES_FILTER_TABS,
  type CasesFilterValue,
  filterCases,
  getCasesFilterGuidance,
} from "../case-filters";
import { CaseCard } from "./CaseCard";
import { CasesEmptyState } from "./CasesEmptyState";

export type CasesSortBy = "lastReviewed" | "confidence" | "ticker";

const CONFIDENCE_ORDER = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;

const TOGGLE_ITEM_CLASS =
  "border-border/40 bg-background/50 backdrop-blur-sm transition-all hover:border-border hover:bg-background/80";

interface CasesWorkspaceProps {
  client: SidecarClient | null;
}

export function CasesWorkspace({ client }: CasesWorkspaceProps) {
  const [cases, setCases] = useState<InvestmentCase[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CasesFilterValue>("all");
  const [sortBy, setSortBy] = useState<CasesSortBy>("lastReviewed");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      setError(null);
      const [casesResult, watchlistResult, portfolioResult] =
        await Promise.allSettled([
          client.listCases(),
          client.getWatchlist(),
          client.getPortfolio(),
        ]);
      if (casesResult.status === "fulfilled") {
        setCases(casesResult.value.cases);
      } else {
        setError("Failed to load cases");
      }
      if (watchlistResult.status === "fulfilled") {
        setWatchlistItems(watchlistResult.value.items);
      }
      if (portfolioResult.status === "fulfilled") {
        setPortfolio(portfolioResult.value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const holdingTickers = useMemo(
    () =>
      new Set((portfolio?.holdings ?? []).map((h) => h.ticker.toUpperCase())),
    [portfolio],
  );

  const watchlistTickers = useMemo(
    () => new Set(watchlistItems.map((w) => w.ticker.toUpperCase())),
    [watchlistItems],
  );

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

  const filteredCases = filterCases(
    cases,
    filter,
    holdingTickers,
    watchlistTickers,
  );

  const sortedCases = [...filteredCases].sort((a, b) => {
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

  const guidance = getCasesFilterGuidance(
    filter,
    filteredCases.length,
    cases.length,
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/[0.05] via-background to-amber-500/[0.03] px-5 py-4 dark:from-primary/[0.10] dark:to-amber-500/[0.05]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary ring-1 ring-primary/10">
              <BriefcaseIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight">
                Investment Cases
              </h2>
              <p className="text-[13px] text-muted-foreground">
                {cases.length} {cases.length === 1 ? "case" : "cases"} tracked
                {filter !== "all" && (
                  <span> · {filteredCases.length} shown</span>
                )}
              </p>
            </div>
          </div>
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
            {cases.length > 0 && (
              <Button
                variant={compareMode ? "secondary" : "outline"}
                size="sm"
                className={TOGGLE_ITEM_CLASS}
                onClick={() => {
                  setCompareMode((prev) => !prev);
                  setSelectedIds([]);
                }}
              >
                <GitCompareArrowsIcon className="size-3.5" />
                {compareMode ? "Cancel" : "Compare"}
              </Button>
            )}
            {cases.length > 0 && (
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={sortBy}
                onValueChange={(v: string) => {
                  if (v) setSortBy(v as CasesSortBy);
                }}
              >
                <ToggleGroupItem
                  value="lastReviewed"
                  className={TOGGLE_ITEM_CLASS}
                >
                  Recent
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="confidence"
                  className={TOGGLE_ITEM_CLASS}
                >
                  Confidence
                </ToggleGroupItem>
                <ToggleGroupItem value="ticker" className={TOGGLE_ITEM_CLASS}>
                  A-Z
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filter}
            onValueChange={(v: string) => {
              if (v) setFilter(v as CasesFilterValue);
            }}
          >
            {CASES_FILTER_TABS.map((tab) => (
              <ToggleGroupItem
                key={tab.value}
                value={tab.value}
                className={TOGGLE_ITEM_CLASS}
              >
                {tab.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {cases.length === 0 && filter === "all" ? (
        <CasesEmptyState
          onDeepDive={() => {
            window.location.hash = "#launchpad";
          }}
        />
      ) : sortedCases.length === 0 ? (
        guidance ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/50 bg-muted/[0.02] px-5 py-4 dark:bg-muted/[0.04]">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06]">
              <SparklesIcon className="size-3.5 text-primary/60" />
            </div>
            <p className="text-[13px] text-muted-foreground/60">{guidance}</p>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              No cases match this filter.
            </p>
          </div>
        )
      ) : (
        <>
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

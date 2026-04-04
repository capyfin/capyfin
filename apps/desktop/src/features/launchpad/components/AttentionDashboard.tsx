import { useCallback, useEffect, useState } from "react";
import type {
  InvestmentCase,
  PortfolioOverview,
  WatchlistItem,
} from "@capyfin/contracts";
import type { SidecarClient } from "@/lib/sidecar/client";
import {
  computeAttentionMetrics,
  computePortfolioRisks,
  computeStaleCases,
  computeWatchlistChanges,
  extractCatalysts,
} from "../attention-utils";
import type { ActionCard } from "../types";
import { AttentionEmptyState } from "./AttentionEmptyState";
import { AttentionSummary } from "./AttentionSummary";
import { MarketContext } from "./MarketContext";
import { NeedsReview } from "./NeedsReview";
import { PortfolioRisks } from "./PortfolioRisks";
import { QuickActions } from "./QuickActions";
import { UpcomingCatalysts } from "./UpcomingCatalysts";
import { WatchlistChanges } from "./WatchlistChanges";

interface AttentionDashboardProps {
  client: SidecarClient | null;
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
}

interface DashboardData {
  cases: InvestmentCase[];
  watchlist: WatchlistItem[];
  portfolio: PortfolioOverview | null;
}

export function AttentionDashboard({
  client,
  onCardClick,
}: AttentionDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [casesRes, watchlistRes, portfolioRes] = await Promise.allSettled([
        client.listCases(),
        client.getWatchlist(),
        client.getPortfolio(),
      ]);

      setData({
        cases: casesRes.status === "fulfilled" ? casesRes.value.cases : [],
        watchlist:
          watchlistRes.status === "fulfilled" ? watchlistRes.value.items : [],
        portfolio:
          portfolioRes.status === "fulfilled" ? portfolioRes.value : null,
      });
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 animate-pulse rounded-lg bg-muted/40" />
        <div className="h-32 animate-pulse rounded-lg bg-muted/40" />
        <div className="h-24 animate-pulse rounded-lg bg-muted/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
        <p className="text-[13px] text-destructive">{error}</p>
      </div>
    );
  }

  const cases = data?.cases ?? [];
  const watchlist = data?.watchlist ?? [];
  const portfolio = data?.portfolio ?? null;

  if (cases.length === 0) {
    return <AttentionEmptyState onCardClick={onCardClick} />;
  }

  const metrics = computeAttentionMetrics(cases, watchlist);
  const staleCases = computeStaleCases(cases);
  const catalysts = extractCatalysts(cases);
  const watchlistChanges = computeWatchlistChanges(watchlist, cases);
  const portfolioRisks = computePortfolioRisks(portfolio, cases);

  return (
    <div className="space-y-6">
      <AttentionSummary metrics={metrics} />
      <MarketContext />
      <NeedsReview staleCases={staleCases} onCardClick={onCardClick} />
      <UpcomingCatalysts catalysts={catalysts} />
      <WatchlistChanges changes={watchlistChanges} />
      {portfolioRisks && <PortfolioRisks risks={portfolioRisks} />}
      <QuickActions onCardClick={onCardClick} />
    </div>
  );
}

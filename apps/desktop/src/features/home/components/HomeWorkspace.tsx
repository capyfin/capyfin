import { useCallback, useEffect, useState } from "react";
import type {
  AttentionItem,
  InvestmentCase,
  PortfolioOverview,
  ReviewQueueItem,
  WatchlistItem,
} from "@capyfin/contracts";
import { HomeIcon } from "lucide-react";
import type { SidecarClient } from "@/lib/sidecar/client";
import type { ActionCard } from "@/features/launchpad/types";
import { ActivityIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewQueueCard } from "@/components/review-queue/ReviewQueueCard";
import { AttentionNow } from "./AttentionNow";
import { RecentCaseUpdates } from "./RecentCaseUpdates";
import { UpcomingCatalysts } from "./UpcomingCatalysts";
import { PersonalizedMarketContext } from "./PersonalizedMarketContext";
import { PortfolioAlerts } from "./PortfolioAlerts";
import { QuickCreate } from "./QuickCreate";
import { HomeEmptyState } from "./HomeEmptyState";
import {
  buildAttentionBullets,
  buildRecentUpdates,
  buildUpcomingCatalysts,
  buildPortfolioAlerts,
  buildMarketContext,
  type MarketContextItem,
  type PortfolioAlert,
} from "../home-utils";

interface HomeWorkspaceProps {
  client: SidecarClient | null;
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
  onOpenCase?: ((caseId: string) => void) | undefined;
}

interface HomeData {
  attentionItems: AttentionItem[];
  reviewQueue: ReviewQueueItem[];
  cases: InvestmentCase[];
  portfolio: PortfolioOverview | null;
  watchlist: WatchlistItem[];
}

export function HomeWorkspace({
  client,
  onCardClick,
  onOpenCase,
}: HomeWorkspaceProps) {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        client.getAttentionItems(),
        client.getReviewQueue(5),
        client.listCases(),
        client.getPortfolio(),
        client.getWatchlist(),
      ]);

      const attentionItems =
        results[0].status === "fulfilled" ? results[0].value.items : [];
      const reviewQueue =
        results[1].status === "fulfilled" ? results[1].value.items : [];
      const cases =
        results[2].status === "fulfilled" ? results[2].value.cases : [];
      const portfolio =
        results[3].status === "fulfilled" ? results[3].value : null;
      const watchlist =
        results[4].status === "fulfilled" ? results[4].value.items : [];

      setData({ attentionItems, reviewQueue, cases, portfolio, watchlist });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (!client) {
    return null;
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasCases = (data?.cases.length ?? 0) > 0;
  const portfolioData = data?.portfolio ?? null;
  const watchlistData = data?.watchlist ?? [];
  const casesData = data?.cases ?? [];

  const marketContextItems = buildMarketContext(
    portfolioData,
    watchlistData,
    casesData,
  );
  const portfolioAlertItems = buildPortfolioAlerts(portfolioData, casesData);
  const bullets = buildAttentionBullets(
    data?.attentionItems ?? [],
    data?.reviewQueue.length ?? 0,
  );

  const showSystemStatus =
    marketContextItems.length > 0 || portfolioAlertItems.length > 0;

  if (!hasCases) {
    const handleOpenCase = (caseId: string) => {
      onOpenCase?.(caseId);
    };

    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <HomeHeader casesCount={0} />
        <HomeEmptyState onCardClick={onCardClick} />
        <AttentionNow bullets={bullets} />
        <ReviewQueueCard
          items={data?.reviewQueue ?? []}
          onOpenCase={handleOpenCase}
          loading={false}
        />
        {showSystemStatus && (
          <SystemStatusPanel
            marketContextItems={marketContextItems}
            portfolioAlertItems={portfolioAlertItems}
          />
        )}
        <QuickCreate onCardClick={onCardClick} />
      </div>
    );
  }
  const recentUpdates = buildRecentUpdates(casesData);
  const upcomingCatalysts = buildUpcomingCatalysts(casesData);

  const handleOpenCase = (caseId: string) => {
    onOpenCase?.(caseId);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
      <HomeHeader casesCount={casesData.length} />

      <AttentionNow bullets={bullets} />

      <ReviewQueueCard
        items={data?.reviewQueue ?? []}
        onOpenCase={handleOpenCase}
        loading={false}
      />

      <RecentCaseUpdates updates={recentUpdates} />

      <UpcomingCatalysts catalysts={upcomingCatalysts} />

      {showSystemStatus && (
        <SystemStatusPanel
          marketContextItems={marketContextItems}
          portfolioAlertItems={portfolioAlertItems}
        />
      )}

      <QuickCreate onCardClick={onCardClick} />
    </div>
  );
}

function SystemStatusPanel({
  marketContextItems,
  portfolioAlertItems,
}: {
  marketContextItems: MarketContextItem[];
  portfolioAlertItems: PortfolioAlert[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15">
          <ActivityIcon className="size-3.5 text-emerald-500/60" />
        </div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/40">
          System Status
        </h2>
        <div className="h-px flex-1 bg-border/30" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b from-card/60 to-card/30 dark:from-card/40 dark:to-card/15">
        <div className="divide-y divide-border/20">
          {marketContextItems.length > 0 && (
            <PersonalizedMarketContext items={marketContextItems} embedded />
          )}
          {portfolioAlertItems.length > 0 && (
            <PortfolioAlerts alerts={portfolioAlertItems} embedded />
          )}
        </div>
      </div>
    </section>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function HomeHeader({ casesCount }: { casesCount: number }) {
  const greeting = getGreeting();
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/[0.06] via-background to-amber-500/[0.04] px-5 py-4 dark:from-primary/[0.12] dark:to-amber-500/[0.06]">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary ring-1 ring-primary/10">
          <HomeIcon className="size-5" />
        </div>
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight">
            {greeting}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {casesCount > 0
              ? `Tracking ${String(casesCount)} ${casesCount === 1 ? "case" : "cases"}`
              : "Your mission control for investment research"}
          </p>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import type {
  AttentionItem,
  InvestmentCase,
  ReviewQueueItem,
} from "@capyfin/contracts";
import type { SidecarClient } from "@/lib/sidecar/client";
import type { ActionCard } from "@/features/launchpad/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewQueueCard } from "@/components/review-queue/ReviewQueueCard";
import { AttentionNow } from "./AttentionNow";
import { RecentCaseUpdates } from "./RecentCaseUpdates";
import { UpcomingCatalysts } from "./UpcomingCatalysts";
import { QuickCreate } from "./QuickCreate";
import { HomeEmptyState } from "./HomeEmptyState";
import {
  buildAttentionBullets,
  buildRecentUpdates,
  buildUpcomingCatalysts,
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
      ]);

      const attentionItems =
        results[0].status === "fulfilled" ? results[0].value.items : [];
      const reviewQueue =
        results[1].status === "fulfilled" ? results[1].value.items : [];
      const cases =
        results[2].status === "fulfilled" ? results[2].value.cases : [];

      setData({ attentionItems, reviewQueue, cases });
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

  if (!hasCases) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <HomeEmptyState onCardClick={onCardClick} />
        <QuickCreate onCardClick={onCardClick} />
      </div>
    );
  }

  const bullets = buildAttentionBullets(
    data?.attentionItems ?? [],
    data?.reviewQueue.length ?? 0,
  );
  const recentUpdates = buildRecentUpdates(data?.cases ?? []);
  const upcomingCatalysts = buildUpcomingCatalysts(data?.cases ?? []);

  const handleOpenCase = (caseId: string) => {
    onOpenCase?.(caseId);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
      <AttentionNow bullets={bullets} />

      <ReviewQueueCard
        items={data?.reviewQueue ?? []}
        onOpenCase={handleOpenCase}
        loading={false}
      />

      <RecentCaseUpdates updates={recentUpdates} />

      <UpcomingCatalysts catalysts={upcomingCatalysts} />

      <QuickCreate onCardClick={onCardClick} />
    </div>
  );
}

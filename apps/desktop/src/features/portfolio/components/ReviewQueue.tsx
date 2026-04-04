import type { InvestmentCase, PortfolioHolding } from "@capyfin/contracts";
import { BookOpenIcon, PlusCircleIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCaseStatus,
  type CaseStatus,
} from "@/features/launchpad/case-lookup";

interface ReviewQueueProps {
  holdings: PortfolioHolding[];
  caseMap: Map<string, InvestmentCase>;
  onViewCase?: ((caseId: string) => void) | undefined;
  onCreateCase?: ((ticker: string) => void) | undefined;
  onRefreshCase?: ((ticker: string) => void) | undefined;
}

interface ReviewItem {
  ticker: string;
  name?: string | undefined;
  status: CaseStatus;
  reason: "missing" | "stale" | "low-confidence";
}

function getReasonLabel(reason: ReviewItem["reason"]): string {
  switch (reason) {
    case "missing":
      return "No case";
    case "stale":
      return "Stale";
    case "low-confidence":
      return "Low confidence";
  }
}

function getReasonStyle(reason: ReviewItem["reason"]): string {
  switch (reason) {
    case "missing":
      return "text-muted-foreground bg-muted/50";
    case "stale":
      return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
    case "low-confidence":
      return "text-red-600 dark:text-red-400 bg-red-500/10";
  }
}

export function ReviewQueue({
  holdings,
  caseMap,
  onViewCase,
  onCreateCase,
  onRefreshCase,
}: ReviewQueueProps) {
  const reviewItems: ReviewItem[] = [];

  for (const holding of holdings) {
    const status = getCaseStatus(holding.ticker, caseMap);
    if (!status.hasCase) {
      reviewItems.push({
        ticker: holding.ticker,
        name: holding.name,
        status,
        reason: "missing",
      });
    } else if (status.isStale) {
      reviewItems.push({
        ticker: holding.ticker,
        name: holding.name,
        status,
        reason: "stale",
      });
    } else if (status.isLowConfidence) {
      reviewItems.push({
        ticker: holding.ticker,
        name: holding.name,
        status,
        reason: "low-confidence",
      });
    }
  }

  // Sort: missing first, then stale (most stale first), then low confidence
  reviewItems.sort((a, b) => {
    const order = { missing: 0, stale: 1, "low-confidence": 2 };
    if (order[a.reason] !== order[b.reason]) {
      return order[a.reason] - order[b.reason];
    }
    if (a.reason === "stale" && b.reason === "stale") {
      return (b.status.daysSinceReview ?? 0) - (a.status.daysSinceReview ?? 0);
    }
    return 0;
  });

  if (reviewItems.length === 0) return null;

  return (
    <Card className="border-border/50 shadow-sm dark:border-border/30">
      <CardHeader>
        <CardTitle className="text-[17px] font-semibold tracking-tight">
          Review Queue
        </CardTitle>
        <CardDescription className="text-[13px]">
          Holdings that need attention — stale or missing investment cases.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border/40">
          {reviewItems.map((item) => (
            <div
              key={item.ticker}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-md bg-foreground/[0.05] px-2.5 py-0.5 font-mono text-[13px] font-bold tracking-wide text-foreground dark:bg-foreground/[0.07]">
                  {item.ticker}
                </span>
                {item.name ? (
                  <span className="text-[13px] text-muted-foreground">
                    {item.name}
                  </span>
                ) : null}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getReasonStyle(item.reason)}`}
                >
                  {getReasonLabel(item.reason)}
                  {item.reason === "stale" &&
                  item.status.daysSinceReview !== undefined
                    ? ` · ${String(item.status.daysSinceReview)}d`
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.status.hasCase && item.status.caseId && onViewCase ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      const caseId = item.status.caseId;
                      if (caseId) onViewCase(caseId);
                    }}
                  >
                    <BookOpenIcon className="size-3" />
                    View
                  </Button>
                ) : null}
                {item.reason === "missing" && onCreateCase ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      onCreateCase(item.ticker);
                    }}
                  >
                    <PlusCircleIcon className="size-3" />
                    Create Case
                  </Button>
                ) : null}
                {(item.reason === "stale" ||
                  item.reason === "low-confidence") &&
                onRefreshCase ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      onRefreshCase(item.ticker);
                    }}
                  >
                    <RefreshCwIcon className="size-3" />
                    Review
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

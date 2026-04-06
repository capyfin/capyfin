import type { ReviewQueueItem, Urgency } from "@capyfin/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck } from "lucide-react";

interface ReviewQueueCardProps {
  items: ReviewQueueItem[];
  onOpenCase: (caseId: string) => void;
  loading?: boolean;
}

const urgencyVariant: Record<Urgency, "destructive" | "default" | "secondary"> =
  {
    high: "destructive",
    medium: "default",
    low: "secondary",
  };

export function ReviewQueueCard({
  items,
  onOpenCase,
  loading,
}: ReviewQueueCardProps) {
  return (
    <Card className="overflow-hidden rounded-xl border-border/50 shadow-sm dark:border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-sm font-semibold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/[0.08] text-primary ring-1 ring-primary/10">
            <ClipboardCheck className="size-4" />
          </div>
          <div>
            <span className="text-[15px] font-semibold tracking-tight">
              Review Queue
            </span>
            {!loading && items.length > 0 && (
              <p className="text-[12px] font-normal text-muted-foreground/70">
                {items.length} {items.length === 1 ? "case" : "cases"} need
                attention
              </p>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-muted-foreground/60">
            No cases need review right now.
          </p>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.caseId}
                className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-gradient-to-r hover:from-primary/[0.04] hover:via-muted/30 hover:to-transparent"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground/[0.04] text-[11px] font-semibold tabular-nums text-muted-foreground/50 dark:bg-foreground/[0.06]">
                  {item.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[12px] font-bold tracking-wide dark:bg-foreground/[0.07]">
                      {item.ticker}
                    </span>
                    <span className="truncate text-[12px] text-muted-foreground">
                      {item.companyName}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground/60">
                    {item.reason}
                  </p>
                </div>
                <Badge
                  variant={urgencyVariant[item.urgency]}
                  className="shrink-0 text-[10px]"
                >
                  {item.urgency}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 px-2.5 text-[11px] opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    onOpenCase(item.caseId);
                  }}
                >
                  Review
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UpcomingCatalyst } from "../home-utils";

interface UpcomingCatalystsProps {
  catalysts: UpcomingCatalyst[];
}

function formatCatalystDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function UpcomingCatalysts({ catalysts }: UpcomingCatalystsProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
        Upcoming Catalysts
      </h2>
      {catalysts.length === 0 ? (
        <p className="py-2 text-[13px] text-muted-foreground/50">
          No upcoming catalysts
        </p>
      ) : (
        <div className="space-y-1">
          {catalysts.map((catalyst) => {
            const isImminent = catalyst.daysUntil <= 3;
            return (
              <div
                key={catalyst.caseId}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/40"
              >
                <CalendarClock
                  className={`size-4 shrink-0 ${isImminent ? "text-amber-500" : "text-muted-foreground/40"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wide dark:bg-foreground/[0.07]">
                      {catalyst.ticker}
                    </span>
                    <span className="truncate text-[12px] text-foreground/80">
                      {catalyst.description}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground/50">
                  {formatCatalystDate(catalyst.date)}
                </span>
                <Badge
                  variant={isImminent ? "default" : "secondary"}
                  className="shrink-0 text-[10px]"
                >
                  {catalyst.daysUntil === 0
                    ? "Today"
                    : catalyst.daysUntil === 1
                      ? "Tomorrow"
                      : `${String(catalyst.daysUntil)}d`}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

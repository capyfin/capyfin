import { Zap } from "lucide-react";
import type { CatalystEntry } from "../attention-utils";

interface UpcomingCatalystsProps {
  catalysts: CatalystEntry[];
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

export function UpcomingCatalysts({ catalysts }: UpcomingCatalystsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Upcoming Catalysts
        </h2>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      {catalysts.length === 0 ? (
        <p className="px-3 text-[12px] text-muted-foreground/60">
          No upcoming catalysts tracked in your cases.
        </p>
      ) : (
        <div className="space-y-1.5">
          {catalysts.map((entry) => (
            <button
              key={entry.caseId}
              type="button"
              onClick={() => {
                window.location.hash = `#cases/${entry.caseId}`;
              }}
              className="flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border/50 hover:bg-muted/30"
            >
              <Zap className="mt-0.5 size-3.5 shrink-0 text-violet-500 dark:text-violet-400" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-foreground">
                    {entry.ticker}
                  </span>
                  <span className="truncate text-[12px] text-muted-foreground">
                    {entry.companyName}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground/80">
                  {truncate(entry.description, 120)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

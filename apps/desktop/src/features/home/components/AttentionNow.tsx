import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  GitBranch,
  ListChecks,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AttentionBullet } from "../home-utils";

interface AttentionNowProps {
  bullets: AttentionBullet[];
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const BULLET_STYLES: Record<
  string,
  { bg: string; border: string; icon: LucideIcon }
> = {
  high: {
    bg: "bg-destructive/10 dark:bg-destructive/15",
    border: "border-destructive/30",
    icon: AlertTriangle,
  },
  medium: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    border: "border-amber-500/30",
    icon: Clock,
  },
  low: {
    bg: "bg-muted",
    border: "border-border/50",
    icon: Eye,
  },
};

const CATEGORY_ICON: Record<string, LucideIcon> = {
  "review-now": AlertTriangle,
  "drift-detected": GitBranch,
  stale: Clock,
  "catalyst-upcoming": Zap,
  "review-soon": ArrowRight,
  "review-queue": ListChecks,
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function AttentionNow({ bullets }: AttentionNowProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex size-6 items-center justify-center rounded-lg bg-destructive/10 dark:bg-destructive/15">
          <AlertTriangle className="size-3.5 text-destructive/60" />
        </div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/40">
          Attention Now
        </h2>
        <div className="h-px flex-1 bg-border/30" />
      </div>
      {bullets.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/40 bg-gradient-to-br from-card/40 to-card/20 px-5 py-4 dark:from-card/25 dark:to-card/10">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/40">
            <Eye className="size-4 text-muted-foreground/40" />
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground/50">
            No attention items yet — create your first case to activate
            monitoring
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {bullets.map((bullet) => {
            const style = BULLET_STYLES[bullet.urgency];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = CATEGORY_ICON[bullet.category] ?? Eye;
            return (
              <div
                key={bullet.category}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all hover:-translate-y-px hover:shadow-sm ${style?.bg ?? "bg-muted"} ${style?.border ?? "border-border/50"}`}
              >
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${bullet.urgency === "high" ? "bg-destructive/15" : bullet.urgency === "medium" ? "bg-amber-500/15" : "bg-muted/60"}`}
                >
                  <Icon
                    className={`size-3.5 ${bullet.urgency === "high" ? "text-destructive" : bullet.urgency === "medium" ? "text-amber-500" : "text-muted-foreground/60"}`}
                  />
                </div>
                <span className="text-[13px] font-medium text-foreground/80">
                  {bullet.message}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

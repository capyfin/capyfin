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
  if (bullets.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/40">
          Attention Now
        </h2>
        <div className="h-px flex-1 bg-border/30" />
      </div>
      <div className="space-y-2">
        {bullets.map((bullet) => {
          const style = BULLET_STYLES[bullet.urgency];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
          const Icon = CATEGORY_ICON[bullet.category] ?? Eye;
          return (
            <div
              key={bullet.category}
              className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${style?.bg ?? "bg-muted"} ${style?.border ?? "border-border/50"}`}
            >
              <Icon className="size-4 shrink-0 text-foreground/60" />
              <span className="text-[13px] text-foreground/80">
                {bullet.message}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

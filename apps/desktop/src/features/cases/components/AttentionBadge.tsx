import type { AttentionState } from "@capyfin/contracts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const attentionStyles: Record<AttentionState, string> = {
  "review-now":
    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  "drift-detected":
    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  stale:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "catalyst-upcoming":
    "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "review-soon":
    "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  healthy:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "valuation-interesting":
    "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20",
};

const attentionLabels: Record<AttentionState, string> = {
  "review-now": "Review Now",
  "drift-detected": "Drift",
  stale: "Stale",
  "catalyst-upcoming": "Catalyst",
  "review-soon": "Review Soon",
  healthy: "Healthy",
  "valuation-interesting": "Val. Interesting",
};

interface AttentionBadgeProps {
  state: AttentionState;
  className?: string;
}

export function AttentionBadge({ state, className }: AttentionBadgeProps) {
  if (state === "healthy") return null;
  return (
    <Badge variant="outline" className={cn(attentionStyles[state], className)}>
      {attentionLabels[state]}
    </Badge>
  );
}

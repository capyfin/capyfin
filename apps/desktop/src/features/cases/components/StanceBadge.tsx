import type { CaseStance } from "@capyfin/contracts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const stanceStyles: Record<CaseStance, string> = {
  bullish:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  bearish: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  neutral: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  watching:
    "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

const stanceLabels: Record<CaseStance, string> = {
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
  watching: "Watching",
};

interface StanceBadgeProps {
  stance: CaseStance;
  className?: string;
}

export function StanceBadge({ stance, className }: StanceBadgeProps) {
  return (
    <Badge variant="outline" className={cn(stanceStyles[stance], className)}>
      {stanceLabels[stance]}
    </Badge>
  );
}

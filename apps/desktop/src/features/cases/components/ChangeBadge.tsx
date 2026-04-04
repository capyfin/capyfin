import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChangeClassification } from "../comparison-utils";

const changeStyles: Record<ChangeClassification, string> = {
  same: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  improved:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  degraded: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  new: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  removed:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

const changeLabels: Record<ChangeClassification, string> = {
  same: "Same",
  improved: "Improved",
  degraded: "Degraded",
  new: "New",
  removed: "Removed",
};

interface ChangeBadgeProps {
  change: ChangeClassification;
  className?: string;
}

export function ChangeBadge({ change, className }: ChangeBadgeProps) {
  return (
    <Badge variant="outline" className={cn(changeStyles[change], className)}>
      {changeLabels[change]}
    </Badge>
  );
}

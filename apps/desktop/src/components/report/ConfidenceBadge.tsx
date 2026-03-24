import type { Confidence } from "@capyfin/contracts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const confidenceStyles: Record<Confidence, string> = {
  HIGH: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  MEDIUM:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  LOW: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
};

const confidenceLabels: Record<Confidence, string> = {
  HIGH: "High confidence",
  MEDIUM: "Medium confidence",
  LOW: "Low confidence",
};

interface ConfidenceBadgeProps {
  confidence: Confidence;
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  className,
}: ConfidenceBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(confidenceStyles[confidence], className)}
    >
      {confidenceLabels[confidence]}
    </Badge>
  );
}

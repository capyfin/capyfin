import {
  BriefcaseIcon,
  FileTextIcon,
  ShieldAlertIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { CASES_EMPTY_TEXT } from "../constants";

interface CasesEmptyStateProps {
  onDeepDive: () => void;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const CASE_FEATURES = [
  {
    icon: FileTextIcon,
    label: "Thesis & key assumptions",
    color: "text-blue-500",
    bg: "bg-blue-500/[0.08]",
    ring: "ring-blue-500/10",
  },
  {
    icon: TrendingUpIcon,
    label: "Valuation range",
    color: "text-emerald-500",
    bg: "bg-emerald-500/[0.08]",
    ring: "ring-emerald-500/10",
  },
  {
    icon: ShieldAlertIcon,
    label: "Risks & invalidation signals",
    color: "text-amber-500",
    bg: "bg-amber-500/[0.08]",
    ring: "ring-amber-500/10",
  },
  {
    icon: TargetIcon,
    label: "Catalysts & next actions",
    color: "text-violet-500",
    bg: "bg-violet-500/[0.08]",
    ring: "ring-violet-500/10",
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function CasesEmptyState({ onDeepDive }: CasesEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
      <EmptyState
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
        icon={BriefcaseIcon}
        iconColor="violet"
        heading="Build your first case"
        description={CASES_EMPTY_TEXT}
        className="flex flex-col items-center gap-5"
      >
        <Button size="sm" onClick={onDeepDive}>
          <SparklesIcon className="size-3.5" />
          Start a Deep Dive
        </Button>
      </EmptyState>

      <div className="w-full max-w-lg">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Each case includes
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {CASE_FEATURES.map((feature) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 px-4 py-3.5 transition-colors dark:bg-card/20"
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${feature.bg} ${feature.ring}`}
                >
                  <Icon className={`size-4 ${feature.color}`} />
                </div>
                <span className="text-[13px] font-medium text-foreground/80">
                  {feature.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

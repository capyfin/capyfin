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
    description: "Structured investment logic and core drivers",
    color: "text-blue-500",
    bg: "bg-blue-500/[0.08]",
    ring: "ring-blue-500/10",
    border: "border-l-blue-500/60",
    gradient:
      "bg-gradient-to-r from-blue-500/[0.06] via-transparent to-transparent dark:from-blue-500/[0.08]",
  },
  {
    icon: TrendingUpIcon,
    label: "Valuation range",
    description: "Fair value estimates with key assumptions",
    color: "text-emerald-500",
    bg: "bg-emerald-500/[0.08]",
    ring: "ring-emerald-500/10",
    border: "border-l-emerald-500/60",
    gradient:
      "bg-gradient-to-r from-emerald-500/[0.06] via-transparent to-transparent dark:from-emerald-500/[0.08]",
  },
  {
    icon: ShieldAlertIcon,
    label: "Risks & invalidation signals",
    description: "What could break the thesis and when to exit",
    color: "text-amber-500",
    bg: "bg-amber-500/[0.08]",
    ring: "ring-amber-500/10",
    border: "border-l-amber-500/60",
    gradient:
      "bg-gradient-to-r from-amber-500/[0.06] via-transparent to-transparent dark:from-amber-500/[0.08]",
  },
  {
    icon: TargetIcon,
    label: "Catalysts & next actions",
    description: "Upcoming events and recommended next steps",
    color: "text-violet-500",
    bg: "bg-violet-500/[0.08]",
    ring: "ring-violet-500/10",
    border: "border-l-violet-500/60",
    gradient:
      "bg-gradient-to-r from-violet-500/[0.06] via-transparent to-transparent dark:from-violet-500/[0.08]",
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

      <div className="w-full max-w-xl">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Each case includes
        </p>
        <div className="grid grid-cols-2 gap-3">
          {CASE_FEATURES.map((feature) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className={`flex items-start gap-3 rounded-xl border border-border/40 border-l-2 ${feature.border} ${feature.gradient} px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-border/60 hover:shadow-md hover:shadow-black/[0.03] dark:border-border/30 dark:hover:shadow-black/20`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${feature.bg} ${feature.ring}`}
                >
                  <Icon className={`size-4 ${feature.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground/90">
                    {feature.label}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground/60">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

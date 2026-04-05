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
  { icon: FileTextIcon, label: "Thesis & key assumptions" },
  { icon: TrendingUpIcon, label: "Valuation range" },
  { icon: ShieldAlertIcon, label: "Risks & invalidation signals" },
  { icon: TargetIcon, label: "Catalysts & next actions" },
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

      <div className="w-full max-w-sm">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          Each case includes
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CASE_FEATURES.map((feature) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="flex items-center gap-2.5 rounded-xl border border-border/30 bg-card/40 px-3.5 py-2.5 opacity-60"
              >
                <Icon className="size-3.5 shrink-0 text-violet-400/70" />
                <span className="text-[12px] text-muted-foreground">
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

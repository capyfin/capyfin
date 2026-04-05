import {
  BriefcaseIcon,
  PieChartIcon,
  PlusIcon,
  ShieldAlertIcon,
  UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { PORTFOLIO_EMPTY_TEXT } from "./PortfolioWorkspace";

interface PortfolioEmptyStateProps {
  onImport: () => void;
  onAddHolding: () => void;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const PORTFOLIO_FEATURES = [
  { icon: PieChartIcon, label: "Allocation & sector exposure" },
  { icon: ShieldAlertIcon, label: "Concentration risk alerts" },
  { icon: BriefcaseIcon, label: "Holdings linked to investment cases" },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function PortfolioEmptyState({
  onImport,
  onAddHolding,
}: PortfolioEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
      <EmptyState
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
        icon={BriefcaseIcon}
        iconColor="emerald"
        heading="Track your portfolio"
        description={PORTFOLIO_EMPTY_TEXT}
        className="flex flex-col items-center gap-5"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onImport}>
            <UploadIcon className="size-3.5" />
            Import CSV
          </Button>
          <Button size="sm" onClick={onAddHolding}>
            <PlusIcon className="size-3.5" />
            Add Position
          </Button>
        </div>
      </EmptyState>

      <div className="w-full max-w-sm">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          Portfolio analysis includes
        </p>
        <div className="flex flex-col gap-2">
          {PORTFOLIO_FEATURES.map((feature) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/40 px-4 py-2.5 opacity-60"
              >
                <Icon className="size-3.5 shrink-0 text-emerald-400/70" />
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

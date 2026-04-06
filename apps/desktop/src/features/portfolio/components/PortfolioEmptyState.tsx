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
  {
    icon: PieChartIcon,
    label: "Allocation & sector exposure",
    color: "text-blue-500",
    bg: "bg-blue-500/[0.08]",
    ring: "ring-blue-500/10",
  },
  {
    icon: ShieldAlertIcon,
    label: "Concentration risk alerts",
    color: "text-amber-500",
    bg: "bg-amber-500/[0.08]",
    ring: "ring-amber-500/10",
  },
  {
    icon: BriefcaseIcon,
    label: "Holdings linked to investment cases",
    color: "text-emerald-500",
    bg: "bg-emerald-500/[0.08]",
    ring: "ring-emerald-500/10",
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function PortfolioEmptyState({
  onImport,
  onAddHolding,
}: PortfolioEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-emerald-500/[0.04] via-background to-primary/[0.02] dark:from-emerald-500/[0.08] dark:to-primary/[0.04]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/[0.03] via-transparent to-transparent" />
        <div className="relative flex flex-col items-center px-6 py-10 text-center">
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
        </div>
      </div>

      <div className="w-full max-w-md">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Portfolio analysis includes
        </p>
        <div className="flex flex-col gap-2.5">
          {PORTFOLIO_FEATURES.map((feature) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="flex items-center gap-3.5 rounded-xl border border-border/40 bg-card/30 px-4 py-3.5 transition-colors dark:bg-card/20"
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

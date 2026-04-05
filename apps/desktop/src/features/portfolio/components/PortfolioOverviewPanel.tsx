import type { PortfolioOverview } from "@capyfin/contracts";
import {
  BriefcaseIcon,
  LayersIcon,
  PieChartIcon,
  PlusIcon,
  UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PortfolioOverviewPanelProps {
  portfolio: PortfolioOverview;
  onImport: () => void;
  onAddHolding: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PortfolioOverviewPanel({
  portfolio,
  onImport,
  onAddHolding,
}: PortfolioOverviewPanelProps) {
  const positionCount = portfolio.holdings.length;
  const sectorCount = portfolio.sectorExposure.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/[0.08] text-emerald-500 ring-1 ring-emerald-500/10">
            <PieChartIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
              Portfolio Overview
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {positionCount} {positionCount === 1 ? "position" : "positions"}{" "}
              across {sectorCount} {sectorCount === 1 ? "sector" : "sectors"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onImport}>
            <UploadIcon className="size-3.5" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={onAddHolding}>
            <PlusIcon className="size-3.5" />
            Add Position
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="overflow-hidden rounded-xl border-border/50 dark:border-border/30">
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/[0.08] ring-1 ring-primary/10">
              <BriefcaseIcon className="size-4.5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Total Value
              </p>
              <p className="text-[18px] font-semibold tabular-nums tracking-tight">
                {formatCurrency(portfolio.totalValue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl border-border/50 dark:border-border/30">
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/[0.08] ring-1 ring-blue-500/10">
              <LayersIcon className="size-4.5 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Positions
              </p>
              <p className="text-[18px] font-semibold tabular-nums tracking-tight">
                {positionCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl border-border/50 dark:border-border/30">
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/[0.08] ring-1 ring-emerald-500/10">
              <LayersIcon className="size-4.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Sectors
              </p>
              <p className="text-[18px] font-semibold tabular-nums tracking-tight">
                {sectorCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

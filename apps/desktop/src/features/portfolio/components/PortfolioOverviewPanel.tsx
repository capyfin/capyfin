import type { PortfolioOverview } from "@capyfin/contracts";
import { BriefcaseIcon, LayersIcon, PlusIcon, UploadIcon } from "lucide-react";
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Portfolio Overview
        </h2>
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
        <Card className="border border-border/70 bg-card/92">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <BriefcaseIcon className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-lg font-semibold">
                {formatCurrency(portfolio.totalValue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/92">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
              <LayersIcon className="size-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Positions</p>
              <p className="text-lg font-semibold">{positionCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/92">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <LayersIcon className="size-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sectors</p>
              <p className="text-lg font-semibold">{sectorCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

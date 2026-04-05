import type { SectorExposure as SectorExposureType } from "@capyfin/contracts";
import { PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SectorExposureProps {
  sectors: SectorExposureType[];
}

const SECTOR_COLORS = [
  {
    bar: "bg-primary",
    dot: "bg-primary",
    text: "text-primary",
  },
  {
    bar: "bg-blue-500",
    dot: "bg-blue-500",
    text: "text-blue-500",
  },
  {
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    text: "text-emerald-500",
  },
  {
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    text: "text-amber-500",
  },
  {
    bar: "bg-rose-500",
    dot: "bg-rose-500",
    text: "text-rose-500",
  },
  {
    bar: "bg-violet-500",
    dot: "bg-violet-500",
    text: "text-violet-500",
  },
  {
    bar: "bg-cyan-500",
    dot: "bg-cyan-500",
    text: "text-cyan-500",
  },
  {
    bar: "bg-orange-500",
    dot: "bg-orange-500",
    text: "text-orange-500",
  },
];

export function SectorExposure({ sectors }: SectorExposureProps) {
  const realSectors = sectors.filter((s) => s.sector !== "Unclassified");
  const allUnclassified = realSectors.length === 0;

  return (
    <Card className="overflow-hidden rounded-xl border-border/50 shadow-sm dark:border-border/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/[0.08] text-emerald-500 ring-1 ring-emerald-500/10">
            <PieChartIcon className="size-4" />
          </div>
          <div>
            <CardTitle className="text-[15px] font-semibold tracking-tight">
              Sector Exposure
            </CardTitle>
            <p className="text-[12px] text-muted-foreground/70">
              Allocation by sector
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        {allUnclassified ? (
          <p className="text-[13px] text-muted-foreground/70">
            Sector data not available — add sectors to positions to see exposure
            breakdown.
          </p>
        ) : (
          <>
            {/* Stacked bar overview */}
            <div className="flex h-3 overflow-hidden rounded-full bg-muted/40">
              {realSectors.map((sector, index) => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- SECTOR_COLORS index is safe with modulo
                const color = SECTOR_COLORS[index % SECTOR_COLORS.length]!;
                return (
                  <div
                    key={sector.sector}
                    className={`${color.bar} opacity-80 transition-all first:rounded-l-full last:rounded-r-full`}
                    style={{
                      width: `${String(Math.min(sector.weight, 100))}%`,
                    }}
                    title={`${sector.sector}: ${sector.weight.toFixed(1)}%`}
                  />
                );
              })}
            </div>

            {/* Sector breakdown */}
            <div className="space-y-3">
              {realSectors.map((sector, index) => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- SECTOR_COLORS index is safe with modulo
                const color = SECTOR_COLORS[index % SECTOR_COLORS.length]!;
                return (
                  <div
                    key={sector.sector}
                    className="group flex items-center gap-3"
                  >
                    <div
                      className={`size-2.5 shrink-0 rounded-full ${color.dot}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                      {sector.sector}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="hidden w-28 sm:block">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                          <div
                            className={`h-full rounded-full ${color.bar} opacity-70 transition-all`}
                            style={{
                              width: `${String(Math.min(sector.weight, 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-14 text-right tabular-nums text-[13px] font-medium text-muted-foreground">
                        {sector.weight.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

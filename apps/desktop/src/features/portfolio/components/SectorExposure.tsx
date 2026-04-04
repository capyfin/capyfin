import type { SectorExposure as SectorExposureType } from "@capyfin/contracts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SectorExposureProps {
  sectors: SectorExposureType[];
}

const COLORS = [
  "bg-primary",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-orange-500",
];

export function SectorExposure({ sectors }: SectorExposureProps) {
  return (
    <Card className="border-border/50 shadow-sm dark:border-border/30">
      <CardHeader>
        <CardTitle className="text-[17px] font-semibold tracking-tight">
          Sector Exposure
        </CardTitle>
        <CardDescription className="text-[13px]">
          Allocation breakdown by sector, based on cost basis.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {sectors.map((sector, index) => (
          <div key={sector.sector} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{sector.sector}</span>
              <span className="text-muted-foreground">
                {sector.weight.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${COLORS[index % COLORS.length] ?? "bg-primary"}`}
                style={{ width: `${String(Math.min(sector.weight, 100))}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

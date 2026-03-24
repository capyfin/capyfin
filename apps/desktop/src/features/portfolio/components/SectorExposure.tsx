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
    <Card className="border border-border/70 bg-card/92 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.4)]">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Sector Exposure</CardTitle>
        <CardDescription>
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

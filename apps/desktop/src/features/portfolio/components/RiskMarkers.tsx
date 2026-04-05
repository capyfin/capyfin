import { ShieldAlertIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskMarker } from "../portfolio-utils";

interface RiskMarkersProps {
  markers: RiskMarker[];
}

const SEVERITY_STYLES: Record<
  string,
  { dot: string; text: string; bg: string }
> = {
  high: {
    dot: "bg-destructive",
    text: "text-foreground/90",
    bg: "bg-destructive/[0.04]",
  },
  medium: {
    dot: "bg-amber-500",
    text: "text-foreground/80",
    bg: "bg-amber-500/[0.04]",
  },
  low: {
    dot: "bg-muted-foreground/40",
    text: "text-foreground/70",
    bg: "",
  },
};

export function RiskMarkers({ markers }: RiskMarkersProps) {
  if (markers.length === 0) return null;

  return (
    <Card className="overflow-hidden rounded-xl border-border/50 shadow-sm dark:border-border/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/[0.08] text-red-500 ring-1 ring-red-500/10">
            <ShieldAlertIcon className="size-4" />
          </div>
          <div>
            <CardTitle className="text-[15px] font-semibold tracking-tight">
              Top Risk Markers
            </CardTitle>
            <p className="text-[12px] text-muted-foreground/70">
              Highest-risk positions in your portfolio
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {markers.map((marker) => {
            const style = SEVERITY_STYLES[marker.severity];
            return (
              <div
                key={marker.ticker}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${style?.bg ?? ""}`}
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${style?.dot ?? "bg-muted-foreground/40"}`}
                />
                <span className="inline-flex shrink-0 items-center rounded-md bg-foreground/[0.05] px-2 py-0.5 font-mono text-[12px] font-bold tracking-wide dark:bg-foreground/[0.07]">
                  {marker.ticker}
                </span>
                <span
                  className={`min-w-0 flex-1 text-[13px] ${style?.text ?? "text-foreground/70"}`}
                >
                  {marker.reason}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

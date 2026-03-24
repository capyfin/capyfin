import { CalendarIcon, DatabaseIcon, LayersIcon } from "lucide-react";

const dataTierLabels: Record<string, string> = {
  "0": "Public data only",
  "1": "Public + basic provider data",
  "2": "Full provider data",
};

interface FreshnessFooterProps {
  dataTier: "0" | "1" | "2";
  sourcesUsed: string[];
  dataAsOf: string;
}

export function FreshnessFooter({
  dataTier,
  sourcesUsed,
  dataAsOf,
}: FreshnessFooterProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-border/60 bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <LayersIcon className="size-3.5" />
        <span className="font-medium">Tier {dataTier}</span>
        <span className="hidden sm:inline">
          — {dataTierLabels[dataTier] ?? "Unknown tier"}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <DatabaseIcon className="size-3.5" />
        {sourcesUsed.length} source{sourcesUsed.length !== 1 ? "s" : ""}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <CalendarIcon className="size-3.5" />
        Data as of {dataAsOf}
      </span>
    </div>
  );
}

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
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-border/40 bg-muted/20 px-4 py-2.5 text-[11px] text-muted-foreground/70">
      <span className="inline-flex items-center gap-1.5">
        <LayersIcon className="size-3" />
        <span className="font-medium">Tier {dataTier}</span>
        <span className="hidden sm:inline">
          — {dataTierLabels[dataTier] ?? "Unknown tier"}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <DatabaseIcon className="size-3" />
        {sourcesUsed.length} source{sourcesUsed.length !== 1 ? "s" : ""}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <CalendarIcon className="size-3" />
        Data as of {dataAsOf}
      </span>
    </div>
  );
}

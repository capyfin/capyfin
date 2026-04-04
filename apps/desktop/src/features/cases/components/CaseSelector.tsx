import type { InvestmentCase } from "@capyfin/contracts";
import { LoaderCircleIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SidecarClient } from "@/lib/sidecar/client";

interface CaseSelectorProps {
  client: SidecarClient | null;
  leftId: string | null;
  rightId: string | null;
  onSelectionChange: (leftId: string | null, rightId: string | null) => void;
}

export function CaseSelector({
  client,
  leftId,
  rightId,
  onSelectionChange,
}: CaseSelectorProps) {
  const [cases, setCases] = useState<InvestmentCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCases = useCallback(async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      const result = await client.listCases();
      setCases(result.cases);
    } catch {
      // Silently fail — empty list is fine
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchCases();
  }, [fetchCases]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircleIcon className="size-4 animate-spin" />
        Loading cases...
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No cases available. Create cases with Deep Dive first.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-500">
          A
        </span>
        <Select
          value={leftId ?? ""}
          onValueChange={(v: string) => {
            onSelectionChange(v || null, rightId);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select a case..." />
          </SelectTrigger>
          <SelectContent>
            {cases.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="font-mono font-semibold">{c.ticker}</span>
                <span className="ml-1.5 text-muted-foreground">
                  {c.companyName}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
        vs
      </span>

      <div className="flex items-center gap-2.5">
        <span className="flex size-5 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-500">
          B
        </span>
        <Select
          value={rightId ?? ""}
          onValueChange={(v: string) => {
            onSelectionChange(leftId, v || null);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select a case..." />
          </SelectTrigger>
          <SelectContent>
            {cases.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="font-mono font-semibold">{c.ticker}</span>
                <span className="ml-1.5 text-muted-foreground">
                  {c.companyName}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

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
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Left
        </span>
        <Select
          value={leftId ?? ""}
          onValueChange={(v: string) => {
            onSelectionChange(v || null, rightId);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a case..." />
          </SelectTrigger>
          <SelectContent>
            {cases.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.ticker} — {c.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span className="text-sm font-medium text-muted-foreground">vs</span>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Right
        </span>
        <Select
          value={rightId ?? ""}
          onValueChange={(v: string) => {
            onSelectionChange(leftId, v || null);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a case..." />
          </SelectTrigger>
          <SelectContent>
            {cases.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.ticker} — {c.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

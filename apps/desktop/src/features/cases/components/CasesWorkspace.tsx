import type { InvestmentCase } from "@capyfin/contracts";
import { LoaderCircleIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SidecarClient } from "@/lib/sidecar/client";
import { CaseCard } from "./CaseCard";
import { CasesEmptyState } from "./CasesEmptyState";

export type CasesSortBy = "lastReviewed" | "confidence" | "ticker";

const CONFIDENCE_ORDER = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;

interface CasesWorkspaceProps {
  client: SidecarClient | null;
}

export function CasesWorkspace({ client }: CasesWorkspaceProps) {
  const [cases, setCases] = useState<InvestmentCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<CasesSortBy>("lastReviewed");

  const fetchCases = useCallback(async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await client.listCases();
      setCases(result.cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchCases();
  }, [fetchCases]);

  if (!client) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Waiting for connection...
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const sortedCases = [...cases].sort((a, b) => {
    if (sortBy === "ticker") {
      return a.ticker.localeCompare(b.ticker);
    }
    if (sortBy === "confidence") {
      return CONFIDENCE_ORDER[b.confidence] - CONFIDENCE_ORDER[a.confidence];
    }
    return (
      new Date(b.lastReviewedAt).getTime() -
      new Date(a.lastReviewedAt).getTime()
    );
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
      {cases.length === 0 ? (
        <CasesEmptyState
          onDeepDive={() => {
            window.location.hash = "#launchpad";
          }}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Investment Cases</h2>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={sortBy}
              onValueChange={(v: string) => {
                if (v) setSortBy(v as CasesSortBy);
              }}
            >
              <ToggleGroupItem value="lastReviewed">Recent</ToggleGroupItem>
              <ToggleGroupItem value="confidence">Confidence</ToggleGroupItem>
              <ToggleGroupItem value="ticker">A-Z</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-3">
            {sortedCases.map((c) => (
              <CaseCard
                key={c.id}
                investmentCase={c}
                onClick={() => {
                  window.location.hash = `#cases/${c.id}`;
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

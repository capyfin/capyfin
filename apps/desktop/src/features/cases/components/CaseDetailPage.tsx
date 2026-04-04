import type { InvestmentCase } from "@capyfin/contracts";
import {
  ArrowLeftIcon,
  GitCompareArrowsIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SidecarClient } from "@/lib/sidecar/client";
import { HistoryTab } from "./HistoryTab";
import { OverviewTab } from "./OverviewTab";
import { SectionTab } from "./SectionTab";
import { CASE_DETAIL_TABS } from "../constants";
import { StanceBadge } from "./StanceBadge";

interface CaseDetailPageProps {
  client: SidecarClient | null;
  caseId: string;
  onRefresh?: ((ticker: string) => void) | undefined;
}

export function CaseDetailPage({
  client,
  caseId,
  onRefresh,
}: CaseDetailPageProps) {
  const [investmentCase, setInvestmentCase] = useState<InvestmentCase | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCase = useCallback(async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await client.getCase(caseId);
      setInvestmentCase(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case");
    } finally {
      setIsLoading(false);
    }
  }, [client, caseId]);

  useEffect(() => {
    void fetchCase();
  }, [fetchCase]);

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

  if (error || !investmentCase) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">{error ?? "Case not found"}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.location.hash = "#cases";
          }}
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to Cases
        </Button>
      </div>
    );
  }

  const reviewedDate = new Date(investmentCase.lastReviewedAt);
  const formattedDate = reviewedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit -ml-2"
        onClick={() => {
          window.location.hash = "#cases";
        }}
      >
        <ArrowLeftIcon className="size-3.5" />
        Cases
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{investmentCase.ticker}</h1>
            <span className="text-lg text-muted-foreground">
              {investmentCase.companyName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StanceBadge stance={investmentCase.stance} />
            <ConfidenceBadge confidence={investmentCase.confidence} />
            <span className="text-xs text-muted-foreground">
              Last reviewed {formattedDate}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <GitCompareArrowsIcon className="size-3.5" />
                Compare
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  window.location.hash = `#cases/compare?left=${investmentCase.id}`;
                }}
              >
                Compare with another case...
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  window.location.hash = `#cases/compare?left=${investmentCase.id}&mode=prior`;
                }}
              >
                Compare with Prior
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onRefresh) {
                onRefresh(investmentCase.ticker);
              }
            }}
          >
            <RefreshCwIcon className="size-3.5" />
            Refresh Case
          </Button>
        </div>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList>
          {CASE_DETAIL_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab investmentCase={investmentCase} />
        </TabsContent>

        <TabsContent value="thesis" className="mt-4">
          <SectionTab
            section={investmentCase.sections.find((s) => s.id === "thesis")}
            emptyMessage="No thesis content available."
          />
        </TabsContent>

        <TabsContent value="valuation" className="mt-4">
          <SectionTab
            section={investmentCase.sections.find((s) => s.id === "valuation")}
            emptyMessage="No valuation content available."
          />
        </TabsContent>

        <TabsContent value="risks" className="mt-4">
          <SectionTab
            section={investmentCase.sections.find((s) => s.id === "risks")}
            emptyMessage="No risks content available."
          />
        </TabsContent>

        <TabsContent value="whatChanged" className="mt-4">
          <SectionTab
            section={investmentCase.sections.find(
              (s) => s.id === "whatChanged",
            )}
            emptyMessage="No changes recorded yet."
          />
        </TabsContent>

        <TabsContent value="catalysts" className="mt-4">
          <SectionTab
            section={investmentCase.sections.find((s) => s.id === "catalysts")}
            emptyMessage="No catalysts content available."
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab history={investmentCase.history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

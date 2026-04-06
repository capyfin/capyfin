import type { InvestmentCase } from "@capyfin/contracts";
import {
  ActivityIcon,
  ArrowLeftIcon,
  CalendarIcon,
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
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => {
          window.location.hash = "#cases";
        }}
      >
        <ArrowLeftIcon className="size-3.5" />
        Cases
      </Button>

      {/* Header card */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm dark:border-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-emerald-500/[0.03] dark:from-primary/[0.10] dark:to-emerald-500/[0.05]" />
        <div className="relative p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/[0.10] font-mono text-lg font-bold tracking-wider text-primary ring-1 ring-primary/15 shadow-sm">
                {investmentCase.ticker.slice(0, 3)}
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="font-mono text-2xl font-bold tracking-wide text-foreground">
                  {investmentCase.ticker}
                </h1>
                <p className="text-[14px] text-muted-foreground">
                  {investmentCase.companyName}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/40 bg-background/60 backdrop-blur-sm"
                  >
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
                className="border-border/40 bg-background/60 backdrop-blur-sm"
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
          <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-border/30 pt-4">
            <StanceBadge stance={investmentCase.stance} />
            <ConfidenceBadge confidence={investmentCase.confidence} />
            <div className="h-3.5 w-px bg-border/40" />
            <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground/60">
              <CalendarIcon className="size-3" />
              Reviewed {formattedDate}
            </span>
            {investmentCase.monitoringEnabled ? (
              <>
                <div className="h-3.5 w-px bg-border/40" />
                <span className="inline-flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400">
                  <ActivityIcon className="size-3" />
                  Monitoring active
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="w-full justify-start gap-0.5 border-b border-border/50 bg-transparent p-0 px-1 rounded-none h-auto">
          {CASE_DETAIL_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-[13px] font-medium text-muted-foreground/70 transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <OverviewTab investmentCase={investmentCase} />
        </TabsContent>

        <TabsContent value="thesis" className="mt-5">
          <SectionTab
            section={investmentCase.sections.find((s) => s.id === "thesis")}
            emptyMessage="No thesis content available."
          />
        </TabsContent>

        <TabsContent value="valuation" className="mt-5">
          <SectionTab
            section={investmentCase.sections.find((s) => s.id === "valuation")}
            emptyMessage="No valuation content available."
          />
        </TabsContent>

        <TabsContent value="risks" className="mt-5">
          <SectionTab
            section={investmentCase.sections.find((s) => s.id === "risks")}
            emptyMessage="No risks content available."
          />
        </TabsContent>

        <TabsContent value="whatChanged" className="mt-5">
          <SectionTab
            section={investmentCase.sections.find(
              (s) => s.id === "whatChanged",
            )}
            emptyMessage="No changes recorded yet."
          />
        </TabsContent>

        <TabsContent value="catalysts" className="mt-5">
          <SectionTab
            section={investmentCase.sections.find((s) => s.id === "catalysts")}
            emptyMessage="No catalysts content available."
          />
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <HistoryTab history={investmentCase.history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

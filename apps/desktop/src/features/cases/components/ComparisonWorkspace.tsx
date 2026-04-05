import type { InvestmentCase } from "@capyfin/contracts";
import { ArrowLeftIcon, LoaderCircleIcon, SaveIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SidecarClient } from "@/lib/sidecar/client";
import { CaseSelector } from "./CaseSelector";
import { ComparisonGrid } from "./ComparisonGrid";
import { DifferencesSummary } from "./DifferencesSummary";
import { PriorComparisonView } from "./PriorComparisonView";
import {
  computeDifferences,
  computePriorComparison,
  type ComparisonResult,
  type PriorComparisonResult,
} from "../comparison-utils";

interface ComparisonWorkspaceProps {
  client: SidecarClient | null;
  leftId: string | null;
  rightId: string | null;
  mode: "case-vs-case" | "prior";
}

export function ComparisonWorkspace({
  client,
  leftId: initialLeftId,
  rightId: initialRightId,
  mode,
}: ComparisonWorkspaceProps) {
  const [leftId, setLeftId] = useState<string | null>(initialLeftId);
  const [rightId, setRightId] = useState<string | null>(initialRightId);
  const [leftCase, setLeftCase] = useState<InvestmentCase | null>(null);
  const [rightCase, setRightCase] = useState<InvestmentCase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCases = useCallback(async () => {
    if (!client) return;

    if (mode === "prior" && leftId) {
      try {
        setIsLoading(true);
        setError(null);
        const caseData = await client.getCase(leftId);
        setLeftCase(caseData);
        setRightCase(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load case");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!leftId || !rightId) {
      setLeftCase(null);
      setRightCase(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [left, right] = await Promise.all([
        client.getCase(leftId),
        client.getCase(rightId),
      ]);
      setLeftCase(left);
      setRightCase(right);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setIsLoading(false);
    }
  }, [client, leftId, rightId, mode]);

  useEffect(() => {
    void fetchCases();
  }, [fetchCases]);

  const handleSelectionChange = useCallback(
    (newLeft: string | null, newRight: string | null) => {
      setLeftId(newLeft);
      setRightId(newRight);
      // Update URL
      const params = new URLSearchParams();
      if (newLeft) params.set("left", newLeft);
      if (newRight) params.set("right", newRight);
      const search = params.toString();
      window.location.hash = `#cases/compare${search ? `?${search}` : ""}`;
    },
    [],
  );

  // Compute comparison results
  const comparisonResult = useMemo<ComparisonResult | null>(() => {
    if (mode !== "prior" && leftCase && rightCase) {
      return computeDifferences(leftCase, rightCase);
    }
    return null;
  }, [mode, leftCase, rightCase]);

  const priorResult = useMemo<PriorComparisonResult | null>(() => {
    if (mode === "prior" && leftCase) {
      return computePriorComparison(leftCase);
    }
    return null;
  }, [mode, leftCase]);

  const handleSaveToLibrary = useCallback(async () => {
    if (!client || !comparisonResult) return;

    try {
      setIsSaving(true);
      const leftLabel = leftCase?.ticker ?? "Case A";
      const rightLabel = rightCase?.ticker ?? "Case B";
      const title = `${leftLabel} vs ${rightLabel} Comparison`;

      const summaryParts: string[] = [];
      if (comparisonResult.stanceChange !== "same") {
        summaryParts.push(
          `Stance: ${comparisonResult.leftStance} → ${comparisonResult.rightStance}`,
        );
      }
      if (comparisonResult.confidenceChange !== "same") {
        summaryParts.push(
          `Confidence: ${comparisonResult.leftConfidence} → ${comparisonResult.rightConfidence}`,
        );
      }
      if (comparisonResult.leftOnlyAssumptions.length > 0) {
        summaryParts.push(
          `${String(comparisonResult.leftOnlyAssumptions.length)} assumptions unique to ${leftLabel}`,
        );
      }
      if (comparisonResult.rightOnlyAssumptions.length > 0) {
        summaryParts.push(
          `${String(comparisonResult.rightOnlyAssumptions.length)} assumptions unique to ${rightLabel}`,
        );
      }
      const summary =
        summaryParts.length > 0
          ? summaryParts.join(". ") + "."
          : "No meaningful differences found.";

      await client.saveReport({
        cardOutput: {
          cardId: "comparison",
          subject: `${leftLabel} vs ${rightLabel}`,
          title,
          summary,
          sections: [],
          keyRisks: [
            ...comparisonResult.leftOnlyRisks,
            ...comparisonResult.rightOnlyRisks,
          ],
          challengeSummary: summary,
          dataTier: "1",
          sourcesUsed: [],
          dataAsOf: new Date().toISOString(),
        },
        workflowType: "comparison",
        subject: `${leftLabel} vs ${rightLabel}`,
        tags: [leftLabel, rightLabel],
      });

      toast.success("Comparison saved to Library");
    } catch {
      toast.error("Failed to save comparison");
    } finally {
      setIsSaving(false);
    }
  }, [client, comparisonResult, leftCase, rightCase]);

  if (!client) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Waiting for connection...
        </p>
      </div>
    );
  }

  const leftLabel = leftCase?.ticker ?? "Left";
  const rightLabel =
    mode === "prior" ? "Prior" : (rightCase?.ticker ?? "Right");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-transparent" />
        <div className="relative flex items-start justify-between gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-bold tracking-tight">
              {mode === "prior"
                ? `${leftCase?.ticker ?? "Case"} — Compare with Prior`
                : "Compare Cases"}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {mode === "prior"
                ? "Current state versus the most recent review"
                : "Side-by-side analysis of two investment cases"}
            </p>
          </div>
          {comparisonResult || priorResult ? (
            <Button
              variant="outline"
              size="sm"
              className="bg-background/60 backdrop-blur-sm"
              disabled={isSaving}
              onClick={() => {
                void handleSaveToLibrary();
              }}
            >
              <SaveIcon className="size-3.5" />
              {isSaving ? "Saving..." : "Save to Library"}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Case selector (only for case-vs-case mode) */}
      {mode === "case-vs-case" ? (
        <CaseSelector
          client={client}
          leftId={leftId}
          rightId={rightId}
          onSelectionChange={handleSelectionChange}
        />
      ) : null}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : mode === "prior" && leftCase && priorResult ? (
        <PriorComparisonView
          investmentCase={leftCase}
          priorComparison={priorResult}
        />
      ) : mode === "prior" && leftCase && !priorResult ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            No prior review history available for this case.
          </p>
        </div>
      ) : comparisonResult ? (
        <div className="flex flex-col gap-6">
          <DifferencesSummary
            result={comparisonResult}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
          />
          <ComparisonGrid
            alignedSections={comparisonResult.alignedSections}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
          />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            Select two cases above to compare them side by side.
          </p>
        </div>
      )}
    </div>
  );
}

import { ArrowRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StanceBadge } from "./StanceBadge";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { ChangeBadge } from "./ChangeBadge";
import type { ComparisonResult } from "../comparison-utils";

interface DifferencesSummaryProps {
  result: ComparisonResult;
  leftLabel: string;
  rightLabel: string;
}

export function DifferencesSummary({
  result,
  leftLabel,
  rightLabel,
}: DifferencesSummaryProps) {
  const hasDifferences =
    result.stanceChange !== "same" ||
    result.confidenceChange !== "same" ||
    result.leftOnlyAssumptions.length > 0 ||
    result.rightOnlyAssumptions.length > 0 ||
    result.leftOnlyRisks.length > 0 ||
    result.rightOnlyRisks.length > 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Differences Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasDifferences ? (
          <p className="text-sm text-muted-foreground/70">
            No meaningful differences detected between these cases.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Stance comparison */}
            {result.stanceChange !== "same" ? (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  Stance
                </span>
                <div className="flex items-center gap-2.5">
                  <StanceBadge stance={result.leftStance} />
                  <ArrowRightIcon className="size-3.5 text-muted-foreground/40" />
                  <StanceBadge stance={result.rightStance} />
                  <ChangeBadge change={result.stanceChange} />
                </div>
              </div>
            ) : null}

            {/* Confidence comparison */}
            {result.confidenceChange !== "same" ? (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  Confidence
                </span>
                <div className="flex items-center gap-2.5">
                  <ConfidenceBadge confidence={result.leftConfidence} />
                  <ArrowRightIcon className="size-3.5 text-muted-foreground/40" />
                  <ConfidenceBadge confidence={result.rightConfidence} />
                  <ChangeBadge change={result.confidenceChange} />
                </div>
              </div>
            ) : null}

            {/* Assumption differences */}
            {result.leftOnlyAssumptions.length > 0 ||
            result.rightOnlyAssumptions.length > 0 ? (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  Key Assumptions
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.leftOnlyAssumptions.length > 0 ? (
                    <div className="flex flex-col gap-1.5 rounded-lg border border-amber-500/10 bg-amber-500/[0.03] p-3">
                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        Only in {leftLabel}
                      </span>
                      {result.leftOnlyAssumptions.map((a, i) => (
                        <span
                          key={`left-${String(i)}`}
                          className="text-[13px] text-muted-foreground"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {result.rightOnlyAssumptions.length > 0 ? (
                    <div className="flex flex-col gap-1.5 rounded-lg border border-blue-500/10 bg-blue-500/[0.03] p-3">
                      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        Only in {rightLabel}
                      </span>
                      {result.rightOnlyAssumptions.map((a, i) => (
                        <span
                          key={`right-${String(i)}`}
                          className="text-[13px] text-muted-foreground"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Risk differences */}
            {result.leftOnlyRisks.length > 0 ||
            result.rightOnlyRisks.length > 0 ? (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  Risks
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.leftOnlyRisks.length > 0 ? (
                    <div className="flex flex-col gap-1.5 rounded-lg border border-red-500/10 bg-red-500/[0.03] p-3">
                      <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
                        Only in {leftLabel}
                      </span>
                      {result.leftOnlyRisks.map((r, i) => (
                        <span
                          key={`left-${String(i)}`}
                          className="text-[13px] text-muted-foreground"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {result.rightOnlyRisks.length > 0 ? (
                    <div className="flex flex-col gap-1.5 rounded-lg border border-red-500/10 bg-red-500/[0.03] p-3">
                      <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
                        Only in {rightLabel}
                      </span>
                      {result.rightOnlyRisks.map((r, i) => (
                        <span
                          key={`right-${String(i)}`}
                          className="text-[13px] text-muted-foreground"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

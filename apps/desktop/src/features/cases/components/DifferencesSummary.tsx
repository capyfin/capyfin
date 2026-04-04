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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Differences Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasDifferences ? (
          <p className="text-sm text-muted-foreground">
            No meaningful differences detected between these cases.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Stance comparison */}
            {result.stanceChange !== "same" ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stance
                </span>
                <div className="flex items-center gap-2">
                  <StanceBadge stance={result.leftStance} />
                  <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                  <StanceBadge stance={result.rightStance} />
                  <ChangeBadge change={result.stanceChange} />
                </div>
              </div>
            ) : null}

            {/* Confidence comparison */}
            {result.confidenceChange !== "same" ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Confidence
                </span>
                <div className="flex items-center gap-2">
                  <ConfidenceBadge confidence={result.leftConfidence} />
                  <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                  <ConfidenceBadge confidence={result.rightConfidence} />
                  <ChangeBadge change={result.confidenceChange} />
                </div>
              </div>
            ) : null}

            {/* Assumption differences */}
            {result.leftOnlyAssumptions.length > 0 ||
            result.rightOnlyAssumptions.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Key Assumptions
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {result.leftOnlyAssumptions.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Only in {leftLabel}:
                      </span>
                      {result.leftOnlyAssumptions.map((a, i) => (
                        <span
                          key={`left-${String(i)}`}
                          className="text-sm text-amber-600 dark:text-amber-400"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {result.rightOnlyAssumptions.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Only in {rightLabel}:
                      </span>
                      {result.rightOnlyAssumptions.map((a, i) => (
                        <span
                          key={`right-${String(i)}`}
                          className="text-sm text-blue-600 dark:text-blue-400"
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
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Risks
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {result.leftOnlyRisks.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Only in {leftLabel}:
                      </span>
                      {result.leftOnlyRisks.map((r, i) => (
                        <span
                          key={`left-${String(i)}`}
                          className="text-sm text-red-600 dark:text-red-400"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {result.rightOnlyRisks.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Only in {rightLabel}:
                      </span>
                      {result.rightOnlyRisks.map((r, i) => (
                        <span
                          key={`right-${String(i)}`}
                          className="text-sm text-red-600 dark:text-red-400"
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

import type { InvestmentCase } from "@capyfin/contracts";
import { ArrowRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { MessageResponse } from "@/components/ai-elements/message";
import { StanceBadge } from "./StanceBadge";
import { ChangeBadge } from "./ChangeBadge";
import type { PriorComparisonResult } from "../comparison-utils";

interface PriorComparisonViewProps {
  investmentCase: InvestmentCase;
  priorComparison: PriorComparisonResult;
}

export function PriorComparisonView({
  investmentCase,
  priorComparison,
}: PriorComparisonViewProps) {
  const whatChangedSection = investmentCase.sections.find(
    (s) => s.id === "whatChanged",
  );

  const historyDate = new Date(priorComparison.historyDate);
  const formattedDate = historyDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Summary card */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            Changes Since Prior Review
          </CardTitle>
          <p className="text-[11px] tabular-nums text-muted-foreground/60">
            Last reviewed {formattedDate}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Stance transition */}
          {priorComparison.stanceChange !== "same" &&
          priorComparison.priorStance ? (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                Stance
              </span>
              <div className="flex items-center gap-2.5">
                <StanceBadge stance={priorComparison.priorStance} />
                <ArrowRightIcon className="size-3.5 text-muted-foreground/40" />
                <StanceBadge stance={priorComparison.currentStance} />
                <ChangeBadge change={priorComparison.stanceChange} />
              </div>
            </div>
          ) : null}

          {/* Confidence transition */}
          {priorComparison.confidenceChange !== "same" &&
          priorComparison.priorConfidence ? (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                Confidence
              </span>
              <div className="flex items-center gap-2.5">
                <ConfidenceBadge confidence={priorComparison.priorConfidence} />
                <ArrowRightIcon className="size-3.5 text-muted-foreground/40" />
                <ConfidenceBadge
                  confidence={priorComparison.currentConfidence}
                />
                <ChangeBadge change={priorComparison.confidenceChange} />
              </div>
            </div>
          ) : null}

          {/* History summary */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Review Summary
            </span>
            <p className="text-[13px] leading-relaxed text-foreground">
              {priorComparison.historySummary}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* What Changed section */}
      {whatChangedSection ? (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              What Changed
              <ConfidenceBadge confidence={whatChangedSection.confidence} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose-sm">
              <MessageResponse>{whatChangedSection.content}</MessageResponse>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Current state overview */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            Current State
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <StanceBadge stance={investmentCase.stance} />
            <ConfidenceBadge confidence={investmentCase.confidence} />
          </div>
          {investmentCase.keyAssumptions.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                Key Assumptions
              </span>
              <ul className="space-y-1.5">
                {investmentCase.keyAssumptions.map((a, i) => (
                  <li
                    key={`assumption-${String(i)}`}
                    className="flex items-start gap-2.5 text-[13px] text-muted-foreground"
                  >
                    <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-emerald-500/40" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

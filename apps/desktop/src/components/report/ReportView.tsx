import type { CardOutput } from "@capyfin/contracts";
import { MessageResponse } from "@/components/ai-elements/message";
import { AlertTriangleIcon, ShieldAlertIcon } from "lucide-react";
import { FollowUpChips } from "./FollowUpChips";
import { FreshnessFooter } from "./FreshnessFooter";
import { ImprovementNote } from "./ImprovementNote";
import { OutputSectionCard } from "./OutputSectionCard";
import { ScoresTable } from "./ScoresTable";

interface ReportViewProps {
  cardOutput: CardOutput;
  onFollowUp?: ((suggestion: string) => void) | undefined;
}

export function ReportView({ cardOutput, onFollowUp }: ReportViewProps) {
  return (
    <div className="space-y-4">
      {/* Title & subject */}
      <div className="space-y-1.5">
        {cardOutput.subject ? (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {cardOutput.subject}
          </p>
        ) : null}
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {cardOutput.title}
        </h2>
      </div>

      {/* Summary */}
      <div className="prose-sm text-muted-foreground">
        <MessageResponse>{cardOutput.summary}</MessageResponse>
      </div>

      {/* Scores table */}
      {cardOutput.scores ? <ScoresTable scores={cardOutput.scores} /> : null}

      {/* Sections */}
      {cardOutput.sections.length > 0 ? (
        <div className="space-y-3">
          {cardOutput.sections.map((section) => (
            <OutputSectionCard key={section.id} section={section} />
          ))}
        </div>
      ) : null}

      {/* Key risks */}
      {cardOutput.keyRisks.length > 0 ? (
        <div className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <AlertTriangleIcon className="size-4 text-amber-500" />
            Key Risks
          </h3>
          <ul className="space-y-1.5 pl-6">
            {cardOutput.keyRisks.map((risk, index) => (
              <li
                key={`risk-${String(index)}`}
                className="list-disc text-sm text-muted-foreground"
              >
                {risk}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Challenge summary */}
      {cardOutput.challengeSummary ? (
        <div className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <ShieldAlertIcon className="size-4 text-muted-foreground" />
            Challenge
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {cardOutput.challengeSummary}
          </p>
        </div>
      ) : null}

      {/* Improvement note */}
      {cardOutput.improvementNote ? (
        <ImprovementNote note={cardOutput.improvementNote} />
      ) : null}

      {/* Freshness footer */}
      <FreshnessFooter
        dataTier={cardOutput.dataTier}
        sourcesUsed={cardOutput.sourcesUsed}
        dataAsOf={cardOutput.dataAsOf}
      />

      {/* Follow-up chips */}
      {cardOutput.followUps && cardOutput.followUps.length > 0 && onFollowUp ? (
        <FollowUpChips
          followUps={cardOutput.followUps}
          onSuggestionClick={onFollowUp}
        />
      ) : null}
    </div>
  );
}

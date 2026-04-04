import type { CardOutput } from "@capyfin/contracts";
import { MessageResponse } from "@/components/ai-elements/message";
import { AlertTriangleIcon, ListPlusIcon, ShieldAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FollowUpChips } from "./FollowUpChips";
import { FreshnessFooter } from "./FreshnessFooter";
import { ImprovementNote } from "./ImprovementNote";
import { OutputSectionCard } from "./OutputSectionCard";
import { ScoresTable } from "./ScoresTable";

interface ReportViewProps {
  cardOutput: CardOutput;
  onFollowUp?: ((suggestion: string) => void) | undefined;
  onAddToWatchlist?: ((ticker: string) => void) | undefined;
}

export function ReportView({
  cardOutput,
  onFollowUp,
  onAddToWatchlist,
}: ReportViewProps) {
  return (
    <div className="space-y-5">
      {/* Title & subject */}
      <div className="rounded-xl border border-border/60 bg-gradient-to-b from-primary/[0.04] to-card/50 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          {cardOutput.subject ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
              {cardOutput.subject}
            </p>
          ) : null}
          {cardOutput.subject && onAddToWatchlist ? (
            <AddToWatchlistButton
              ticker={cardOutput.subject}
              onAddToWatchlist={onAddToWatchlist}
            />
          ) : null}
        </div>
        <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
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
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-5 py-4">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            <AlertTriangleIcon className="size-4" />
            Key Risks
          </h3>
          <ul className="mt-3 space-y-2 pl-1">
            {cardOutput.keyRisks.map((risk, index) => (
              <li
                key={`risk-${String(index)}`}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
              >
                <span className="mt-2 block size-1.5 shrink-0 rounded-full bg-amber-500/60" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Challenge summary */}
      {cardOutput.challengeSummary ? (
        <div className="rounded-xl border border-border/60 bg-muted/30 px-5 py-4">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <ShieldAlertIcon className="size-4" />
            Challenge
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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

function AddToWatchlistButton({
  ticker,
  onAddToWatchlist,
}: {
  ticker: string;
  onAddToWatchlist: (ticker: string) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
      onClick={() => {
        onAddToWatchlist(ticker);
      }}
    >
      <ListPlusIcon className="size-3.5" />
      Add to Watchlist
    </Button>
  );
}

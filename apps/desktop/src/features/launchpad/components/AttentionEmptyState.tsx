import { useState, useCallback } from "react";
import { Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actionCards } from "../card-registry";
import type { ActionCard } from "../types";
import { TickerInputDialog } from "./TickerInputDialog";

interface AttentionEmptyStateProps {
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
}

export function AttentionEmptyState({ onCardClick }: AttentionEmptyStateProps) {
  const [pendingCard, setPendingCard] = useState<ActionCard | null>(null);

  const handleCreateCase = useCallback(() => {
    const deepDive = actionCards.find((c) => c.id === "deep-dive");
    if (!deepDive) return;
    setPendingCard(deepDive);
  }, []);

  const handleTickerSubmit = useCallback(
    (card: ActionCard, ticker: string) => {
      onCardClick?.(card, ticker);
    },
    [onCardClick],
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] px-4 py-3 dark:bg-primary/[0.08]">
      <Sparkles className="size-4 shrink-0 text-primary" />
      <p className="flex-1 text-[13px] text-muted-foreground">
        No cases yet — start a{" "}
        <strong className="text-foreground">Deep Dive</strong> to build your
        first investment thesis.
      </p>
      <Button
        size="sm"
        className="h-7 shrink-0 gap-1.5 px-3 text-[12px] shadow-sm"
        onClick={handleCreateCase}
      >
        <Search data-icon="inline-start" className="size-3" />
        Start Deep Dive
      </Button>

      <TickerInputDialog
        card={pendingCard}
        open={pendingCard !== null}
        onOpenChange={(open) => {
          if (!open) setPendingCard(null);
        }}
        onSubmit={handleTickerSubmit}
      />
    </div>
  );
}

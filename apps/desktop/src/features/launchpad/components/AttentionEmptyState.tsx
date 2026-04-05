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
    <div className="relative overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-r from-primary/[0.06] via-primary/[0.03] to-transparent px-5 py-4 dark:from-primary/[0.10] dark:via-primary/[0.05]">
      <div className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.10] ring-1 ring-primary/[0.08]">
          <Sparkles className="size-4.5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-foreground">
            Build your first investment case
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground/70">
            Start a Deep Dive to create a structured thesis with key
            assumptions, risks, and valuation.
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 shrink-0 gap-1.5 rounded-lg px-4 text-[12px] shadow-sm"
          onClick={handleCreateCase}
        >
          <Search data-icon="inline-start" className="size-3.5" />
          Start Deep Dive
        </Button>
      </div>

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

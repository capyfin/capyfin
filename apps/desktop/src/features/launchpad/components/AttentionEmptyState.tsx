import { Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actionCards } from "../card-registry";
import type { ActionCard } from "../types";

interface AttentionEmptyStateProps {
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
}

export function AttentionEmptyState({ onCardClick }: AttentionEmptyStateProps) {
  const handleCreateCase = () => {
    const deepDive = actionCards.find((c) => c.id === "deep-dive");
    if (!deepDive) return;

    const el = document.querySelector(`[data-card-id="deep-dive"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.click();
    } else {
      onCardClick?.(deepDive);
    }
  };

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
    </div>
  );
}

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
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-primary/[0.03] via-background to-violet-500/[0.03] px-6 py-8 text-center dark:from-primary/[0.05] dark:to-violet-500/[0.05]">
      <div className="pointer-events-none absolute -left-12 -top-12 size-48 rounded-full bg-primary/[0.04] blur-3xl" />

      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="size-5 text-primary" />
      </div>

      <h3 className="mt-4 text-[16px] font-semibold text-foreground">
        Welcome to your attention dashboard
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        This is where you&apos;ll see what needs your attention — stale reviews,
        confidence changes, upcoming catalysts, and watchlist signals. Create
        your first investment case to get started.
      </p>

      <Button className="mt-5 gap-1.5" onClick={handleCreateCase}>
        <Search data-icon="inline-start" className="size-3.5" />
        Create Your First Case
      </Button>
    </div>
  );
}

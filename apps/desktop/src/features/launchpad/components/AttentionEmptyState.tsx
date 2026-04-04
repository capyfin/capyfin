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
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-primary/[0.04] via-background to-violet-500/[0.03] px-6 py-10 text-center dark:from-primary/[0.08] dark:to-violet-500/[0.06]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-primary/[0.05] blur-3xl dark:bg-primary/[0.08]" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-violet-500/[0.04] blur-3xl dark:bg-violet-500/[0.06]" />

      {/* Dot grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative">
        {/* Icon with ring */}
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/[0.06] dark:ring-primary/[0.08]">
          <Sparkles className="size-6 text-primary" />
        </div>

        <h3 className="mt-5 text-[18px] font-semibold tracking-tight text-foreground">
          Welcome to your attention dashboard
        </h3>
        <p className="mx-auto mt-2.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          Build your first investment case to unlock stale-review alerts,
          confidence tracking, catalyst monitoring, and watchlist signals.
        </p>

        <Button
          className="mt-6 gap-2 px-5 shadow-sm"
          onClick={handleCreateCase}
        >
          <Search data-icon="inline-start" className="size-3.5" />
          Create Your First Case
        </Button>
      </div>
    </div>
  );
}

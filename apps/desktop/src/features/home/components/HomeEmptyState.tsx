import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actionCards } from "@/features/launchpad/card-registry";
import type { ActionCard } from "@/features/launchpad/types";

interface HomeEmptyStateProps {
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
}

export function HomeEmptyState({ onCardClick }: HomeEmptyStateProps) {
  const deepDiveCard = actionCards.find((c) => c.id === "deep-dive");

  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-border/50 bg-muted/[0.02] dark:bg-muted/[0.04]">
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10">
          <Sparkles className="size-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Give CapyFin a name to care about
        </h2>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          Create your first investment case. CapyFin will monitor it, detect
          changes, and tell you what deserves attention.
        </p>
        {deepDiveCard ? (
          <Button
            className="mt-5"
            size="default"
            onClick={() => {
              onCardClick?.(deepDiveCard);
            }}
          >
            Create Your First Case
          </Button>
        ) : null}
      </div>
    </div>
  );
}

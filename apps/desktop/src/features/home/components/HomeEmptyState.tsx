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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="size-7 text-primary" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        Give CapyFin a name to care about
      </h2>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
        Start by creating your first investment case. CapyFin will monitor it,
        detect changes, and tell you what deserves attention.
      </p>
      {deepDiveCard ? (
        <Button
          className="mt-6"
          size="lg"
          onClick={() => {
            onCardClick?.(deepDiveCard);
          }}
        >
          Create Your First Case
        </Button>
      ) : null}
    </div>
  );
}

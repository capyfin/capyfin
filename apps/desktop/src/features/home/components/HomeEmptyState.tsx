import { ArrowRightIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actionCards } from "@/features/launchpad/card-registry";
import type { ActionCard } from "@/features/launchpad/types";

interface HomeEmptyStateProps {
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
}

export function HomeEmptyState({ onCardClick }: HomeEmptyStateProps) {
  const deepDiveCard = actionCards.find((c) => c.id === "deep-dive");
  const morningBriefCard = actionCards.find((c) => c.id === "morning-brief");

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-primary/[0.04] via-background to-amber-500/[0.02] dark:from-primary/[0.08] dark:to-amber-500/[0.04]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/[0.03] via-transparent to-transparent" />
      <div className="relative flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm ring-1 ring-primary/15">
          <Sparkles className="size-7 text-primary" />
        </div>
        <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
          Give CapyFin a name to care about
        </h2>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          Create your first investment case. CapyFin will monitor it, detect
          changes, and tell you what deserves attention.
        </p>
        <div className="mt-6 flex items-center gap-3">
          {deepDiveCard ? (
            <Button
              size="default"
              onClick={() => {
                onCardClick?.(deepDiveCard);
              }}
            >
              Create Your First Case
              <ArrowRightIcon className="ml-1 size-3.5" />
            </Button>
          ) : null}
          {morningBriefCard ? (
            <Button
              variant="outline"
              size="default"
              className="border-border/50 bg-background/50 backdrop-blur-sm"
              onClick={() => {
                onCardClick?.(morningBriefCard);
              }}
            >
              Morning Brief
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

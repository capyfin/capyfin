import { ActionCardItem } from "@/features/launchpad/components/ActionCardItem";
import { actionCards } from "@/features/launchpad/card-registry";
import type { ActionCard } from "@/features/launchpad/types";

interface QuickCreateProps {
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
}

const QUICK_CREATE_IDS = ["deep-dive", "morning-brief", "fair-value"];

const quickCards = actionCards.filter((c) => QUICK_CREATE_IDS.includes(c.id));

export function QuickCreate({ onCardClick }: QuickCreateProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/40">
          Quick Create
        </h2>
        <div className="h-px flex-1 bg-border/30" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*:last-child:nth-child(odd)]:sm:col-span-2">
        {quickCards.map((card) => (
          <ActionCardItem key={card.id} card={card} onCardClick={onCardClick} />
        ))}
      </div>
    </section>
  );
}

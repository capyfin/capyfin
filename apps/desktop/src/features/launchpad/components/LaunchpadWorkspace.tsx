import { cardSections } from "../card-registry";
import type { ActionCard } from "../types";
import { ActionCardItem } from "./ActionCardItem";
import { CardSection } from "./CardSection";

interface LaunchpadWorkspaceProps {
  onCardClick?: (card: ActionCard, input?: string) => void;
}

export function LaunchpadWorkspace({ onCardClick }: LaunchpadWorkspaceProps) {
  const visibleSections = cardSections.filter((s) => s.cards.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          What would you like to explore?
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Pick an action card to get structured, methodology-backed analysis.
        </p>
      </div>

      {visibleSections.map((section) => (
        <CardSection key={section.id} title={section.title}>
          {section.cards.map((card) => (
            <ActionCardItem
              key={card.id}
              card={card}
              onCardClick={onCardClick}
            />
          ))}
        </CardSection>
      ))}
    </div>
  );
}

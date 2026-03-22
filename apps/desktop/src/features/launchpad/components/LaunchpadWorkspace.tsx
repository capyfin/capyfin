import { useMemo } from "react";
import type { SidecarClient } from "@/lib/sidecar/client";
import { cardSections } from "../card-registry";
import { resolveCard } from "../resolve-card";
import type { ActionCard } from "../types";
import { useFmpConnected } from "../use-fmp-connected";
import { ActionCardItem } from "./ActionCardItem";
import { CardSection } from "./CardSection";

interface LaunchpadWorkspaceProps {
  client: SidecarClient | null;
  onCardClick?: (card: ActionCard, input?: string) => void;
}

export function LaunchpadWorkspace({
  client,
  onCardClick,
}: LaunchpadWorkspaceProps) {
  const isFmpConnected = useFmpConnected(client);

  const resolvedSections = useMemo(
    () =>
      cardSections
        .map((section) => ({
          ...section,
          cards: section.cards.map((card) => resolveCard(card, isFmpConnected)),
        }))
        .filter((s) => s.cards.length > 0),
    [isFmpConnected],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-4">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          What would you like to explore?
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Pick an action card to get structured, methodology-backed analysis.
        </p>
      </div>

      {resolvedSections.map((section) => (
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

import { useMemo } from "react";
import type { AgentSession } from "@capyfin/contracts";
import type { SidecarClient } from "@/lib/sidecar/client";
import { cardSections } from "../card-registry";
import { resolveCard } from "../resolve-card";
import type { ActionCard } from "../types";
import { useFmpConnected } from "../use-fmp-connected";
import { ActionCardItem } from "./ActionCardItem";
import { CardSection } from "./CardSection";
import { LaunchpadHeroBar } from "./LaunchpadHeroBar";
import { RecentActivitySection } from "./RecentActivitySection";
import { SuggestionsSection } from "./SuggestionsSection";

interface LaunchpadWorkspaceProps {
  client: SidecarClient | null;
  sessions: AgentSession[];
  onCardClick?: (card: ActionCard, input?: string) => void;
  onSessionSelect?: (sessionId: string) => void;
  onOpenCommandPalette?: () => void;
}

export function LaunchpadWorkspace({
  client,
  sessions,
  onCardClick,
  onSessionSelect,
  onOpenCommandPalette,
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 pb-8">
      <LaunchpadHeroBar
        onCardClick={onCardClick}
        onOpenCommandPalette={onOpenCommandPalette}
      />

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

      <RecentActivitySection
        sessions={sessions}
        onSessionSelect={onSessionSelect}
      />

      <SuggestionsSection
        sessions={sessions}
        onSessionSelect={onSessionSelect}
        onCardClick={onCardClick}
      />
    </div>
  );
}

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 pb-8">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/[0.04] via-background to-amber-500/[0.03] px-8 py-10 dark:from-primary/[0.06] dark:to-amber-500/[0.04]">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/[0.04] blur-3xl dark:bg-primary/[0.06]" />
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">
          What would you like to explore?
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
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

import { useMemo } from "react";
import {
  Lightbulb,
  RotateCcw,
  Play,
  Plus,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import type { AgentSession } from "@capyfin/contracts";
import type { ActionCard } from "../types";
import { actionCards } from "../card-registry";

interface SuggestionsSectionProps {
  sessions: AgentSession[];
  onSessionSelect?: ((sessionId: string) => void) | undefined;
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
}

interface Suggestion {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const FALLBACK_SUGGESTIONS: {
  id: string;
  label: string;
  icon: LucideIcon;
  cardId?: string;
  href?: string;
}[] = [
  {
    id: "start-morning-brief",
    label: "Start with a Morning Brief",
    icon: Newspaper,
    cardId: "morning-brief",
  },
  {
    id: "add-watchlist",
    label: "Add tickers to your Watchlist",
    icon: Plus,
    href: "#watchlist",
  },
  {
    id: "try-deep-dive",
    label: "Try a Deep Dive on any stock",
    icon: Play,
    cardId: "deep-dive",
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function SuggestionsSection({
  sessions,
  onSessionSelect,
  onCardClick,
}: SuggestionsSectionProps) {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
  const suggestions: Suggestion[] = useMemo(() => {
    if (sessions.length === 0) {
      return FALLBACK_SUGGESTIONS.map((fs) => ({
        id: fs.id,
        label: fs.label,
        icon: fs.icon,
        action: () => {
          if (fs.href) {
            window.location.hash = fs.href;
            return;
          }
          if (fs.cardId) {
            const card = actionCards.find((c) => c.id === fs.cardId);
            if (card?.input === "none") {
              onCardClick?.(card);
            } else if (card) {
              const el = document.querySelector(
                `[data-card-id="${fs.cardId}"]`,
              );
              if (el instanceof HTMLElement) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.click();
              }
            }
          }
        },
      }));
    }

    // Build contextual suggestions from session history
    const sorted = [...sessions].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    const result: Suggestion[] = [];

    // Suggest continuing the most recent session
    const mostRecent = sorted[0];
    if (mostRecent) {
      result.push({
        id: `continue-${mostRecent.id}`,
        label: `Continue: ${mostRecent.label ?? mostRecent.sessionKey}`,
        icon: Play,
        action: () => onSessionSelect?.(mostRecent.id),
      });
    }

    // Suggest re-running a previous session (second most recent)
    const second = sorted[1];
    if (second) {
      result.push({
        id: `rerun-${second.id}`,
        label: `Re-run: ${second.label ?? second.sessionKey}`,
        icon: RotateCcw,
        action: () => onSessionSelect?.(second.id),
      });
    }

    // Check if user has run Morning Brief recently (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const hasMorningBrief = sorted.some(
      (s) =>
        s.label?.toLowerCase().includes("morning brief") &&
        new Date(s.updatedAt) >= weekAgo,
    );

    if (!hasMorningBrief) {
      const morningBriefCard = actionCards.find(
        (c) => c.id === "morning-brief",
      );
      if (morningBriefCard) {
        result.push({
          id: "suggest-morning-brief",
          label: "You haven't run a Morning Brief this week",
          icon: Newspaper,
          action: () => onCardClick?.(morningBriefCard),
        });
      }
    }

    return result.slice(0, 3);
  }, [sessions, onSessionSelect, onCardClick]);
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Suggestions
        </h2>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <div className="flex flex-col gap-1.5">
        {suggestions.map((suggestion) => {
          /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
          const Icon = suggestion.icon;
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          return (
            <button
              key={suggestion.id}
              type="button"
              onClick={suggestion.action}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/[0.06] text-amber-500/70 dark:bg-amber-500/[0.08]">
                <Icon className="size-3.5" />
              </div>
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                {suggestion.label}
              </p>
              <Lightbulb className="size-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

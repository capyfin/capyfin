import { useState, useMemo, useCallback } from "react";
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
import { formatSessionLabel } from "@/features/chat/session-label";
import { TickerInputDialog } from "./TickerInputDialog";

interface SuggestionsSectionProps {
  sessions: AgentSession[];
  onSessionSelect?: ((sessionId: string) => void) | undefined;
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
}

interface Suggestion {
  id: string;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  action: () => void;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const FALLBACK_SUGGESTIONS: {
  id: string;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  cardId?: string;
  href?: string;
}[] = [
  {
    id: "start-morning-brief",
    label: "Start with a Morning Brief",
    icon: Newspaper,
    iconBg: "bg-amber-500/[0.06] group-hover:bg-amber-500/[0.10]",
    iconColor: "text-amber-500/60 group-hover:text-amber-500/80",
    cardId: "morning-brief",
  },
  {
    id: "add-watchlist",
    label: "Add tickers to your Watchlist",
    icon: Plus,
    iconBg: "bg-blue-500/[0.06] group-hover:bg-blue-500/[0.10]",
    iconColor: "text-blue-500/60 group-hover:text-blue-500/80",
    href: "#watchlist",
  },
  {
    id: "try-deep-dive",
    label: "Try a Deep Dive on any stock",
    icon: Play,
    iconBg: "bg-violet-500/[0.06] group-hover:bg-violet-500/[0.10]",
    iconColor: "text-violet-500/60 group-hover:text-violet-500/80",
    cardId: "deep-dive",
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function SuggestionsSection({
  sessions,
  onSessionSelect,
  onCardClick,
}: SuggestionsSectionProps) {
  const [pendingCard, setPendingCard] = useState<ActionCard | null>(null);

  const handleTickerSubmit = useCallback(
    (card: ActionCard, ticker: string) => {
      onCardClick?.(card, ticker);
    },
    [onCardClick],
  );

  /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
  const suggestions: Suggestion[] = useMemo(() => {
    const mapFallback = (fs: (typeof FALLBACK_SUGGESTIONS)[number]) => ({
      id: fs.id,
      label: fs.label,
      icon: fs.icon,
      iconBg: fs.iconBg,
      iconColor: fs.iconColor,
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
            setPendingCard(card);
          }
        }
      },
    });

    if (sessions.length === 0) {
      return FALLBACK_SUGGESTIONS.map(mapFallback);
    }

    // Build contextual suggestions from session history
    const sorted = [...sessions].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    // Only suggest sessions with meaningful labels (skip unnamed / hex-ID sessions)
    const named = sorted.filter(
      (s) => formatSessionLabel(s) !== "New conversation",
    );

    // If no named sessions exist, fall through to fallback suggestions
    if (named.length === 0) {
      return FALLBACK_SUGGESTIONS.map(mapFallback);
    }

    const result: Suggestion[] = [];

    // Suggest continuing the most recent named session
    const mostRecent = named[0];
    if (mostRecent) {
      result.push({
        id: `continue-${mostRecent.id}`,
        label: `Continue: ${formatSessionLabel(mostRecent)}`,
        icon: Play,
        iconBg: "bg-blue-500/[0.06] group-hover:bg-blue-500/[0.10]",
        iconColor: "text-blue-500/60 group-hover:text-blue-500/80",
        action: () => onSessionSelect?.(mostRecent.id),
      });
    }

    // Suggest re-running a previous named session (second most recent)
    const second = named[1];
    if (second) {
      result.push({
        id: `rerun-${second.id}`,
        label: `Re-run: ${formatSessionLabel(second)}`,
        icon: RotateCcw,
        iconBg: "bg-emerald-500/[0.06] group-hover:bg-emerald-500/[0.10]",
        iconColor: "text-emerald-500/60 group-hover:text-emerald-500/80",
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
          iconBg: "bg-amber-500/[0.06] group-hover:bg-amber-500/[0.10]",
          iconColor: "text-amber-500/60 group-hover:text-amber-500/80",
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
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Suggestions
        </h2>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      <div className="flex flex-col gap-1">
        {suggestions.map((suggestion) => {
          /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
          const Icon = suggestion.icon;
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          return (
            <button
              key={suggestion.id}
              type="button"
              onClick={suggestion.action}
              className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-all hover:border-border/40 hover:bg-muted/40"
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${suggestion.iconBg}`}
              >
                <Icon className={`size-3.5 ${suggestion.iconColor}`} />
              </div>
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                {suggestion.label}
              </p>
              <Lightbulb className="size-3 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        })}
      </div>

      <TickerInputDialog
        card={pendingCard}
        open={pendingCard !== null}
        onOpenChange={(open) => {
          if (!open) setPendingCard(null);
        }}
        onSubmit={handleTickerSubmit}
      />
    </section>
  );
}

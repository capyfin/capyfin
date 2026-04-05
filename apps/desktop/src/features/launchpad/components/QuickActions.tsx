import { useState, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Newspaper,
  Plus,
  GitCompareArrows,
  type LucideIcon,
} from "lucide-react";
import { actionCards } from "../card-registry";
import type { ActionCard } from "../types";
import { TickerInputDialog } from "./TickerInputDialog";

interface QuickActionsProps {
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
}

interface QuickActionDef {
  id: string;
  label: string;
  icon: LucideIcon;
  cardId?: string;
  href?: string;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const quickActionDefs: QuickActionDef[] = [
  {
    id: "new-deep-dive",
    label: "New Deep Dive",
    icon: Search,
    cardId: "deep-dive",
  },
  {
    id: "review-position",
    label: "Review Position",
    icon: RefreshCw,
    cardId: "position-review",
  },
  {
    id: "morning-brief",
    label: "Run Morning Brief",
    icon: Newspaper,
    cardId: "morning-brief",
  },
  {
    id: "compare-cases",
    label: "Compare Cases",
    icon: GitCompareArrows,
    href: "#cases/compare",
  },
  {
    id: "add-watchlist",
    label: "Add to Watchlist",
    icon: Plus,
    href: "#watchlist",
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function QuickActions({ onCardClick }: QuickActionsProps) {
  const [pendingCard, setPendingCard] = useState<ActionCard | null>(null);

  const handleAction = useCallback(
    (def: QuickActionDef) => {
      if (def.href) {
        window.location.hash = def.href;
        return;
      }
      if (def.cardId) {
        const card = actionCards.find((c) => c.id === def.cardId);
        if (!card) return;

        if (card.input === "none") {
          onCardClick?.(card);
        } else {
          setPendingCard(card);
        }
      }
    },
    [onCardClick],
  );

  const handleTickerSubmit = useCallback(
    (card: ActionCard, ticker: string) => {
      onCardClick?.(card, ticker);
    },
    [onCardClick],
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Quick Actions
        </h2>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {quickActionDefs.map((def) => {
          /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
          const Icon = def.icon;
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          return (
            <button
              key={def.id}
              type="button"
              className="group/qa flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-card/50 px-3 py-3.5 text-center transition-all hover:border-border/70 hover:bg-card hover:shadow-sm dark:bg-card/30 dark:hover:bg-card/60"
              onClick={() => {
                handleAction(def);
              }}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/[0.06] text-primary/70 transition-colors group-hover/qa:bg-primary/[0.10] group-hover/qa:text-primary dark:bg-primary/[0.08]">
                <Icon className="size-5" />
              </div>
              <span className="text-[12px] font-medium text-muted-foreground transition-colors group-hover/qa:text-foreground">
                {def.label}
              </span>
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

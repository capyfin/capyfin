import { useState, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Newspaper,
  Plus,
  GitCompareArrows,
  type LucideIcon,
} from "lucide-react";
import { allCards } from "../card-registry";
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
  iconBg: string;
  iconColor: string;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const quickActionDefs: QuickActionDef[] = [
  {
    id: "new-deep-dive",
    label: "New Deep Dive",
    icon: Search,
    cardId: "deep-dive",
    iconBg: "bg-blue-500/[0.08] group-hover/qa:bg-blue-500/[0.14]",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "review-position",
    label: "Review Position",
    icon: RefreshCw,
    cardId: "position-review",
    iconBg: "bg-emerald-500/[0.08] group-hover/qa:bg-emerald-500/[0.14]",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "morning-brief",
    label: "Run Morning Brief",
    icon: Newspaper,
    cardId: "morning-brief",
    iconBg: "bg-amber-500/[0.08] group-hover/qa:bg-amber-500/[0.14]",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "compare-cases",
    label: "Compare Cases",
    icon: GitCompareArrows,
    href: "#cases/compare",
    iconBg: "bg-violet-500/[0.08] group-hover/qa:bg-violet-500/[0.14]",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "add-watchlist",
    label: "Add to Watchlist",
    icon: Plus,
    href: "#watchlist",
    iconBg: "bg-rose-500/[0.08] group-hover/qa:bg-rose-500/[0.14]",
    iconColor: "text-rose-600 dark:text-rose-400",
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
        const card = allCards.find((c) => c.id === def.cardId);
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
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Quick Actions
        </h2>
        <div className="h-px flex-1 bg-border/40" />
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
              <div
                className={`flex size-8 items-center justify-center rounded-lg transition-colors ${def.iconBg}`}
              >
                <Icon className={`size-4 ${def.iconColor}`} />
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

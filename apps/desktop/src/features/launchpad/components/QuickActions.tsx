import { useCallback } from "react";
import {
  Search,
  RefreshCw,
  Newspaper,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { actionCards } from "../card-registry";
import type { ActionCard } from "../types";

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
    id: "add-watchlist",
    label: "Add to Watchlist",
    icon: Plus,
    href: "#watchlist",
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function QuickActions({ onCardClick }: QuickActionsProps) {
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
          const el = document.querySelector(`[data-card-id="${def.cardId}"]`);
          if (el instanceof HTMLElement) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.click();
          }
        }
      }
    },
    [onCardClick],
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Quick Actions
        </h2>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <div className="flex flex-wrap gap-2">
        {quickActionDefs.map((def) => {
          /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
          const Icon = def.icon;
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          return (
            <Button
              key={def.id}
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                handleAction(def);
              }}
            >
              <Icon data-icon="inline-start" className="size-3.5" />
              {def.label}
            </Button>
          );
        })}
      </div>
    </section>
  );
}

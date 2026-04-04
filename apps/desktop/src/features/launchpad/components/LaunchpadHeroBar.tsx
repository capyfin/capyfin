import { useCallback, useMemo } from "react";
import {
  Newspaper,
  Search,
  Plus,
  Command,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { actionCards } from "../card-registry";
import type { ActionCard } from "../types";

interface LaunchpadHeroBarProps {
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
  onOpenCommandPalette?: (() => void) | undefined;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

interface QuickActionDef {
  id: string;
  label: string;
  icon: LucideIcon;
  cardId?: string | undefined;
  href?: string | undefined;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const quickActionDefs: QuickActionDef[] = [
  {
    id: "morning-brief",
    label: "Morning Brief",
    icon: Newspaper,
    cardId: "morning-brief",
  },
  { id: "deep-dive", label: "Deep Dive", icon: Search, cardId: "deep-dive" },
  {
    id: "add-to-watchlist",
    label: "Add to Watchlist",
    icon: Plus,
    href: "#watchlist",
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function LaunchpadHeroBar({
  onCardClick,
  onOpenCommandPalette,
}: LaunchpadHeroBarProps) {
  const greeting = useMemo(() => getGreeting(), []);
  const formattedDate = useMemo(() => getFormattedDate(), []);

  const handleQuickAction = useCallback(
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
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/[0.05] via-background to-amber-500/[0.03] px-5 py-3.5 dark:from-primary/[0.10] dark:to-amber-500/[0.05]">
      {/* Greeting row: heading + date + actions all in one line */}
      <div className="flex items-center gap-4">
        {/* Greeting + date */}
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {greeting}
          </h1>
          <span className="text-[13px] text-muted-foreground">
            {formattedDate}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search / command palette trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex h-7 items-center gap-2 rounded-md border border-border/50 bg-background/40 px-2.5 text-[12px] text-muted-foreground backdrop-blur-sm transition-all hover:border-border hover:bg-background/80 hover:text-foreground hover:shadow-sm"
        >
          <Search className="size-3" />
          <span className="hidden sm:inline">Search…</span>
          <kbd className="ml-1 hidden rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex sm:items-center sm:gap-0.5">
            <Command className="size-2.5" />K
          </kbd>
        </button>
      </div>

      {/* Quick actions row */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {quickActionDefs.map((def) => {
          /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
          const Icon = def.icon;
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          return (
            <Button
              key={def.id}
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-border/50 bg-background/40 px-2.5 text-[12px] backdrop-blur-sm transition-all hover:border-border hover:bg-background/80 hover:shadow-sm"
              onClick={() => {
                handleQuickAction(def);
              }}
            >
              <Icon data-icon="inline-start" className="size-3" />
              {def.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

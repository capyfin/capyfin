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
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/[0.04] via-background to-amber-500/[0.03] px-8 py-8 dark:from-primary/[0.06] dark:to-amber-500/[0.04]">
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/[0.04] blur-3xl dark:bg-primary/[0.06]" />

      {/* Greeting + date */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">
          {greeting}
        </h1>
        <p className="text-[15px] text-muted-foreground">{formattedDate}</p>
      </div>

      {/* Market summary placeholder */}
      <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-muted-foreground/70">
        Connect a data provider for live market context and personalized
        insights.
      </p>

      {/* Quick actions + search row */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {quickActionDefs.map((def) => {
          /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
          const Icon = def.icon;
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          return (
            <Button
              key={def.id}
              variant="outline"
              size="sm"
              onClick={() => {
                handleQuickAction(def);
              }}
            >
              <Icon data-icon="inline-start" className="size-3.5" />
              {def.label}
            </Button>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search / command palette trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex h-7 items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-2.5 text-[13px] text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground"
        >
          <Search className="size-3.5" />
          <span className="hidden sm:inline">Search actions…</span>
          <kbd className="ml-1 hidden rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex sm:items-center sm:gap-0.5">
            <Command className="size-2.5" />K
          </kbd>
        </button>
      </div>
    </div>
  );
}

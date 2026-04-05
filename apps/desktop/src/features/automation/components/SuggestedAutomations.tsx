import {
  Activity,
  ClockIcon,
  ListChecks,
  ListOrdered,
  Newspaper,
  PieChart,
  PlusIcon,
  type LucideIcon,
} from "lucide-react";
import { SCHEDULABLE_CARDS } from "./AutomationEmptyState";

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const iconMap: Record<string, LucideIcon> = {
  Newspaper,
  Activity,
  ListChecks,
  ListOrdered,
  PieChart,
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

const benefitMap: Record<string, string> = {
  "morning-brief":
    "Start every session with a clear picture of overnight moves and fresh signals",
  "market-health":
    "Spot regime shifts and rotation early so you can position ahead of the crowd",
  "watchlist-digest":
    "Never miss a thesis-relevant move across your tracked names",
  "review-queue": "Start each day knowing exactly which names deserve review",
  "portfolio-review":
    "Catch concentration drift and exposure imbalances before they matter",
};

/**
 * Returns the SCHEDULABLE_CARDS entries whose IDs are not in the given list
 * of already-configured automation card IDs.
 */
export function getSuggestedCards(existingCardIds: string[]) {
  const existing = new Set(existingCardIds);
  return SCHEDULABLE_CARDS.filter((card) => !existing.has(card.id));
}

interface SuggestedAutomationsProps {
  existingCardIds: string[];
  onSetUp: (cardId: string) => void;
}

export function SuggestedAutomations({
  existingCardIds,
  onSetUp,
}: SuggestedAutomationsProps) {
  const suggested = getSuggestedCards(existingCardIds);

  if (suggested.length === 0) return null;

  return (
    <div className="mt-2 flex-1">
      <div className="mb-4 flex items-center gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Suggested Automations
        </h3>
        <div className="h-px flex-1 bg-border/30" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suggested.map((card) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
          const Icon = iconMap[card.icon];
          const benefit = benefitMap[card.id];
          return (
            <button
              key={card.id}
              type="button"
              className={`group/card flex flex-col items-start gap-4 rounded-xl border border-border/60 bg-card/40 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-card/60 hover:shadow-md hover:shadow-black/[0.03] dark:bg-card/20 dark:hover:bg-card/35 dark:hover:shadow-black/20 ${card.hoverBg} ${card.hoverBorder}`}
              onClick={() => {
                onSetUp(card.id);
              }}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${card.bg} ${card.ring}`}
              >
                {Icon ? <Icon className={`size-5 ${card.color}`} /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold tracking-tight text-foreground/90">
                  {card.title}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground/70">
                  {card.description}
                </p>
                {benefit ? (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/50">
                    {benefit}
                  </p>
                ) : null}
              </div>
              <div className="flex w-full items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                  <ClockIcon className="size-3" />
                  {card.schedule}
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-md border border-border/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground/60 transition-all group-hover/card:border-border/60 group-hover/card:text-foreground/70">
                  <PlusIcon className="size-3" />
                  Set up
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

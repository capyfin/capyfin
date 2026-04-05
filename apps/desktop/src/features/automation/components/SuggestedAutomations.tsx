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
    <div className="mt-2">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/40">
          Suggested Automations
        </h3>
        <div className="h-px flex-1 bg-border/20" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 [&>*:last-child:nth-child(odd)]:sm:col-span-2">
        {suggested.map((card) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
          const Icon = iconMap[card.icon];
          return (
            <button
              key={card.id}
              type="button"
              className="group/card flex items-center gap-3 rounded-xl border border-dashed border-border/40 bg-card/20 px-4 py-3 text-left transition-all duration-200 hover:border-border/60 hover:bg-card/40 dark:bg-card/10 dark:hover:bg-card/25"
              onClick={() => {
                onSetUp(card.id);
              }}
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg opacity-50 ring-1 ${card.bg} ${card.ring}`}
              >
                {Icon ? <Icon className={`size-3.5 ${card.color}`} /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium tracking-tight text-foreground/70">
                  {card.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/50">
                  {card.description}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-md border border-border/30 px-2 py-1 text-[11px] font-medium text-muted-foreground/40 opacity-0 transition-opacity group-hover/card:opacity-100">
                <PlusIcon className="size-3" />
                Set up
              </span>
              <span className="hidden shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground/30 sm:flex group-hover/card:hidden">
                <ClockIcon className="size-2.5" />
                {card.schedule}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

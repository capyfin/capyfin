import {
  Activity,
  ClockIcon,
  ListChecks,
  ListOrdered,
  Newspaper,
  PieChart,
  PlusIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { AUTOMATION_EMPTY_TEXT } from "./AutomationWorkspace";

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const iconMap: Record<string, LucideIcon> = {
  Newspaper,
  Activity,
  ListChecks,
  ListOrdered,
  PieChart,
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

export const SCHEDULABLE_CARDS = [
  {
    id: "morning-brief",
    icon: "Newspaper",
    title: "Morning Brief",
    description: "Daily market context and watchlist signals",
    schedule: "Weekdays at 8:00 AM",
    defaultTime: "08:00",
    defaultDays: [...WEEKDAYS],
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/15",
    hoverBg: "hover:bg-blue-500/[0.06]",
    hoverBorder: "hover:border-blue-500/30",
  },
  {
    id: "market-health",
    icon: "Activity",
    title: "Market Health",
    description: "Regime score, breadth, sector rotation signals",
    schedule: "Weekdays at 7:30 AM",
    defaultTime: "07:30",
    defaultDays: [...WEEKDAYS],
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/15",
    hoverBg: "hover:bg-amber-500/[0.06]",
    hoverBorder: "hover:border-amber-500/30",
  },
  {
    id: "watchlist-digest",
    icon: "ListChecks",
    title: "Watchlist Digest",
    description: "Weekly recap of watchlist changes and new signals",
    schedule: "Every Monday at 9:00 AM",
    defaultTime: "09:00",
    defaultDays: ["monday"],
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/15",
    hoverBg: "hover:bg-emerald-500/[0.06]",
    hoverBorder: "hover:border-emerald-500/30",
  },
  {
    id: "review-queue",
    icon: "ListOrdered",
    title: "Review Queue",
    description: "Prioritized list of cases needing attention",
    schedule: "Weekdays at 8:30 AM",
    defaultTime: "08:30",
    defaultDays: [...WEEKDAYS],
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/15",
    hoverBg: "hover:bg-violet-500/[0.06]",
    hoverBorder: "hover:border-violet-500/30",
  },
  {
    id: "portfolio-review",
    icon: "PieChart",
    title: "Portfolio Review",
    description:
      "Recurring health check — allocation, concentration, regime fit",
    schedule: "Every Sunday at 10:00 AM",
    defaultTime: "10:00",
    defaultDays: ["sunday"],
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/15",
    hoverBg: "hover:bg-rose-500/[0.06]",
    hoverBorder: "hover:border-rose-500/30",
  },
];

/**
 * Returns the default schedule (time + days) for a given card ID,
 * or null if the card ID is not found in SCHEDULABLE_CARDS.
 */
export function getDefaultScheduleForCard(
  cardId: string,
): { time: string; days: string[] } | null {
  const card = SCHEDULABLE_CARDS.find((c) => c.id === cardId);
  if (!card) return null;
  return { time: card.defaultTime, days: [...card.defaultDays] };
}

interface AutomationEmptyStateProps {
  onCreate: () => void;
  onCreateWithCard?: (cardId: string) => void;
}

export function AutomationEmptyState({
  onCreate,
  onCreateWithCard,
}: AutomationEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-8">
      <EmptyState
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
        icon={ZapIcon}
        iconColor="amber"
        heading="Automate your research"
        description={AUTOMATION_EMPTY_TEXT}
        className="flex flex-col items-center gap-5"
      >
        <Button size="sm" onClick={onCreate}>
          <PlusIcon className="size-3.5" />
          Create Automation
        </Button>
      </EmptyState>

      <div className="w-full max-w-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-6 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/15">
            <ZapIcon className="size-3.5 text-amber-500/60" />
          </div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
            Popular automations
          </h3>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 [&>*:last-child:nth-child(odd)]:sm:col-span-2">
          {SCHEDULABLE_CARDS.map((card) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = iconMap[card.icon];
            return (
              <button
                key={card.id}
                type="button"
                className={`flex items-center gap-3.5 rounded-xl border border-border/60 bg-card/60 px-4 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/[0.03] dark:bg-card/40 dark:hover:shadow-black/20 ${card.hoverBg} ${card.hoverBorder}`}
                onClick={() => onCreateWithCard?.(card.id)}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${card.bg} ${card.ring}`}
                >
                  {Icon ? <Icon className={`size-4 ${card.color}`} /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold tracking-tight text-foreground">
                    {card.title}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <p className="hidden shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground/60 sm:flex">
                  <ClockIcon className="size-3" />
                  {card.schedule}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

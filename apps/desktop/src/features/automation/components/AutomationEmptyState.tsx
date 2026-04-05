import {
  CalendarIcon,
  ClockIcon,
  NewspaperIcon,
  PlusIcon,
  RefreshCwIcon,
  ZapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { AUTOMATION_EMPTY_TEXT } from "./AutomationWorkspace";

interface AutomationEmptyStateProps {
  onCreate: () => void;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const EXAMPLE_AUTOMATIONS = [
  {
    icon: NewspaperIcon,
    label: "Morning Brief",
    description: "Daily market context and watchlist signals",
    schedule: "Weekdays at 8:00 AM",
    color: "text-blue-500",
    bg: "bg-blue-500/[0.08]",
    ring: "ring-blue-500/10",
  },
  {
    icon: RefreshCwIcon,
    label: "Weekly Watchlist Digest",
    description: "Summarize changes across all watched names",
    schedule: "Every Monday at 9:00 AM",
    color: "text-emerald-500",
    bg: "bg-emerald-500/[0.08]",
    ring: "ring-emerald-500/10",
  },
  {
    icon: CalendarIcon,
    label: "Post-Earnings Review",
    description: "Auto-refresh cases after earnings reports",
    schedule: "Triggered by earnings",
    color: "text-violet-500",
    bg: "bg-violet-500/[0.08]",
    ring: "ring-violet-500/10",
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function AutomationEmptyState({ onCreate }: AutomationEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
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

      <div className="w-full max-w-lg">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Example automations
        </p>
        <div className="flex flex-col gap-2.5">
          {EXAMPLE_AUTOMATIONS.map((example) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = example.icon;
            return (
              <div
                key={example.label}
                className="flex items-center gap-3.5 rounded-xl border border-border/40 bg-card/30 px-4 py-3.5 transition-colors dark:bg-card/20"
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${example.bg} ${example.ring}`}
                >
                  <Icon className={`size-4 ${example.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground/80">
                    {example.label}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground/50">
                    {example.description}
                  </p>
                </div>
                <p className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground/40">
                  <ClockIcon className="size-3" />
                  {example.schedule}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

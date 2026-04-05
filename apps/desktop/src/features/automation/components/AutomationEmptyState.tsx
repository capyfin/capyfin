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
    schedule: "Weekdays at 8:00 AM",
    color: "text-blue-500",
    bg: "bg-blue-500/[0.06]",
  },
  {
    icon: RefreshCwIcon,
    label: "Weekly Watchlist Digest",
    schedule: "Every Monday at 9:00 AM",
    color: "text-emerald-500",
    bg: "bg-emerald-500/[0.06]",
  },
  {
    icon: CalendarIcon,
    label: "Post-Earnings Review",
    schedule: "Triggered by earnings",
    color: "text-violet-500",
    bg: "bg-violet-500/[0.06]",
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

      <div className="w-full max-w-md">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          Example automations
        </p>
        <div className="flex flex-col gap-2">
          {EXAMPLE_AUTOMATIONS.map((example) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = example.icon;
            return (
              <div
                key={example.label}
                className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/40 px-4 py-3 opacity-60"
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${example.bg}`}
                >
                  <Icon className={`size-3.5 ${example.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground">
                    {example.label}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                    <ClockIcon className="size-3" />
                    {example.schedule}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import type { Automation } from "@capyfin/contracts";
import {
  CalendarClockIcon,
  CheckCircleIcon,
  EllipsisVerticalIcon,
  HistoryIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatEventTriggerLabel,
  formatScheduleSummary,
} from "../schedule-utils";

function lastRunBadge(status: Automation["lastRunStatus"]) {
  if (!status) return null;
  switch (status) {
    case "success":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-green-600 text-green-600"
        >
          <CheckCircleIcon className="size-3" />
          OK
        </Badge>
      );
    case "failure":
      return (
        <Badge variant="outline" className="gap-1 border-red-600 text-red-600">
          <XCircleIcon className="size-3" />
          Failed
        </Badge>
      );
    case "running":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-yellow-600 text-yellow-600"
        >
          <ZapIcon className="size-3" />
          Running
        </Badge>
      );
  }
}

const DEST_LABELS: Record<string, string> = {
  library: "Library",
  telegram: "Telegram",
  discord: "Discord",
  slack: "Slack",
  email: "Email",
};

function triggerSummary(automation: Automation): string {
  if (automation.trigger.type === "event") {
    return formatEventTriggerLabel(automation.trigger.eventType);
  }
  return formatScheduleSummary(automation.trigger.schedule);
}

interface AutomationListProps {
  automations: Automation[];
  onToggle: (automation: Automation) => void;
  onEdit: (automation: Automation) => void;
  onDelete: (automation: Automation) => void;
  onViewRuns: (automation: Automation) => void;
}

export function AutomationList({
  automations,
  onToggle,
  onEdit,
  onDelete,
  onViewRuns,
}: AutomationListProps) {
  return (
    <div className="flex flex-col gap-3">
      {automations.map((auto) => {
        const isEvent = auto.trigger.type === "event";
        const accentBg = auto.enabled
          ? isEvent
            ? "bg-gradient-to-r from-violet-500/[0.03] to-transparent dark:from-violet-500/[0.06]"
            : "bg-gradient-to-r from-amber-500/[0.03] to-transparent dark:from-amber-500/[0.06]"
          : "";
        const accentBorder = auto.enabled
          ? isEvent
            ? "border-l-2 border-l-violet-500/40"
            : "border-l-2 border-l-amber-500/40"
          : "border-l-2 border-l-transparent";
        return (
          <Card
            key={auto.id}
            className={`group flex items-center gap-4 border-border/50 px-4 py-3.5 transition-all hover:border-border/70 hover:shadow-sm ${accentBg} ${accentBorder} ${!auto.enabled ? "opacity-55" : ""}`}
          >
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${auto.enabled ? (isEvent ? "bg-violet-500/[0.08] ring-1 ring-violet-500/10" : "bg-amber-500/[0.08] ring-1 ring-amber-500/10") : "bg-muted"}`}
            >
              {isEvent ? (
                <ZapIcon
                  className={`size-4 ${auto.enabled ? "text-violet-500" : "text-muted-foreground"}`}
                />
              ) : (
                <CalendarClockIcon
                  className={`size-4 ${auto.enabled ? "text-amber-500" : "text-muted-foreground"}`}
                />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-semibold tracking-tight text-foreground">
                  {auto.cardTitle}
                </span>
                <Badge
                  variant={auto.enabled ? "default" : "secondary"}
                  className={`rounded-full text-[10px] ${auto.enabled ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400" : ""}`}
                >
                  {auto.enabled ? "Active" : "Paused"}
                </Badge>
                {isEvent && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-violet-500/30 text-[10px] text-violet-600 dark:text-violet-400"
                  >
                    Event
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <span>{triggerSummary(auto)}</span>
                <span className="text-muted-foreground/30">&#x2192;</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.04] px-1.5 py-0.5 text-[11px] font-medium dark:bg-foreground/[0.06]">
                  {DEST_LABELS[auto.destination] ?? auto.destination}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {lastRunBadge(auto.lastRunStatus)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <EllipsisVerticalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      onToggle(auto);
                    }}
                  >
                    {auto.enabled ? (
                      <>
                        <PauseIcon className="mr-2 size-3.5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <PlayIcon className="mr-2 size-3.5" />
                        Resume
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onEdit(auto);
                    }}
                  >
                    <PencilIcon className="mr-2 size-3.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onViewRuns(auto);
                    }}
                  >
                    <HistoryIcon className="mr-2 size-3.5" />
                    View Runs
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onDelete(auto);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2Icon className="mr-2 size-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

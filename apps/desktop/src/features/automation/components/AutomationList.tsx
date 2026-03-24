import type { Automation } from "@capyfin/contracts";
import {
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
import { formatScheduleSummary } from "../schedule-utils";

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
      {automations.map((auto) => (
        <Card
          key={auto.id}
          className={`flex items-center gap-4 px-4 py-3 ${!auto.enabled ? "opacity-60" : ""}`}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ZapIcon className="size-4 text-muted-foreground" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {auto.cardTitle}
              </span>
              <Badge
                variant={auto.enabled ? "default" : "secondary"}
                className="text-[10px]"
              >
                {auto.enabled ? "Active" : "Paused"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatScheduleSummary(auto.schedule)}</span>
              <span>→ {DEST_LABELS[auto.destination] ?? auto.destination}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {lastRunBadge(auto.lastRunStatus)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
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
      ))}
    </div>
  );
}

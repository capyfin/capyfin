import type { AutomationRun } from "@capyfin/contracts";
import {
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  LoaderCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SidecarClient } from "@/lib/sidecar/client";
import { formatDuration } from "../schedule-utils";

function statusBadge(status: AutomationRun["status"]) {
  switch (status) {
    case "success":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-green-600 text-green-600"
        >
          <CheckCircleIcon className="size-3" />
          Success
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
          <LoaderCircleIcon className="size-3 animate-spin" />
          Running
        </Badge>
      );
  }
}

interface RunHistoryPanelProps {
  automationId: string | null;
  automationName: string | null;
  open: boolean;
  onClose: () => void;
  client: SidecarClient;
}

export function RunHistoryPanel({
  automationId,
  automationName,
  open,
  onClose,
  client,
}: RunHistoryPanelProps) {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    if (!automationId) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await client.listAutomationRuns(automationId);
      setRuns(result.runs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
    } finally {
      setIsLoading(false);
    }
  }, [client, automationId]);

  useEffect(() => {
    if (open && automationId) {
      void fetchRuns();
    }
  }, [open, automationId, fetchRuns]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Run History — {automationName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-destructive">{error}</p>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <ClockIcon className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No runs yet for this automation.
            </p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(run.startedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{statusBadge(run.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDuration(run.duration)}
                    </TableCell>
                    <TableCell>
                      {run.outputReportId ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="View Report in Library"
                        >
                          <ExternalLinkIcon className="size-3.5" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

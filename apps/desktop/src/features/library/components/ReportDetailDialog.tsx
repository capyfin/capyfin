import type { SavedReport } from "@capyfin/contracts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReportView } from "@/components/report";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCopyIcon,
  DownloadIcon,
  PinIcon,
  StarIcon,
} from "lucide-react";

function formatWorkflowType(type: string): string {
  return type
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface ReportDetailDialogProps {
  report: SavedReport | null;
  onClose: () => void;
  onCopyMarkdown: (report: SavedReport) => void;
  onDownloadMarkdown: (report: SavedReport) => void;
}

export function ReportDetailDialog({
  report,
  onClose,
  onCopyMarkdown,
  onDownloadMarkdown,
}: ReportDetailDialogProps) {
  return (
    <Dialog
      open={report !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {report ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[11px]">
                  {formatWorkflowType(report.workflowType)}
                </Badge>
                {report.pinnedAt ? (
                  <PinIcon className="size-3.5 text-foreground" />
                ) : null}
                {report.starred ? (
                  <StarIcon
                    className="size-3.5 text-amber-500"
                    fill="currentColor"
                  />
                ) : null}
              </div>
              <DialogTitle>{report.cardOutput.title}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Saved {new Date(report.savedAt).toLocaleDateString()}
              </p>
            </DialogHeader>

            <div className="py-2">
              <ReportView cardOutput={report.cardOutput} />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onCopyMarkdown(report);
                }}
              >
                <ClipboardCopyIcon className="size-3.5" />
                Copy as Markdown
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDownloadMarkdown(report);
                }}
              >
                <DownloadIcon className="size-3.5" />
                Download Markdown
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

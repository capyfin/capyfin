import type { SavedReport } from "@capyfin/contracts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  PinIcon,
  StarIcon,
  Trash2Icon,
  FileDownIcon,
  ClipboardCopyIcon,
} from "lucide-react";

function formatWorkflowType(type: string): string {
  return type
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatRelativeDate(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${String(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${String(hours)}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${String(days)}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

interface SavedReportCardProps {
  report: SavedReport;
  onOpen: (report: SavedReport) => void;
  onPin: (report: SavedReport) => void;
  onStar: (report: SavedReport) => void;
  onDelete: (report: SavedReport) => void;
  onCopyMarkdown: (report: SavedReport) => void;
  onDownloadMarkdown: (report: SavedReport) => void;
}

export function SavedReportCard({
  report,
  onOpen,
  onPin,
  onStar,
  onDelete,
  onCopyMarkdown,
  onDownloadMarkdown,
}: SavedReportCardProps) {
  const summarySnippet =
    report.cardOutput.summary.length > 120
      ? `${report.cardOutput.summary.slice(0, 120)}...`
      : report.cardOutput.summary;

  return (
    <Card
      size="sm"
      className="cursor-pointer transition-colors hover:bg-muted/40"
      onClick={() => {
        onOpen(report);
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="shrink-0 text-[11px]">
                {formatWorkflowType(report.workflowType)}
              </Badge>
              {report.subject ? (
                <span className="truncate text-xs font-medium text-muted-foreground">
                  {report.subject}
                </span>
              ) : null}
            </div>
            <CardTitle className="line-clamp-2 text-sm">
              {report.cardOutput.title}
            </CardTitle>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              className={`inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-muted ${
                report.pinnedAt
                  ? "text-foreground"
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onPin(report);
              }}
              aria-label={report.pinnedAt ? "Unpin" : "Pin"}
            >
              <PinIcon className="size-3.5" />
            </button>
            <button
              type="button"
              className={`inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-muted ${
                report.starred
                  ? "text-amber-500"
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onStar(report);
              }}
              aria-label={report.starred ? "Unstar" : "Star"}
            >
              <StarIcon
                className="size-3.5"
                fill={report.starred ? "currentColor" : "none"}
              />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  aria-label="More actions"
                >
                  <MoreHorizontalIcon className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem
                  onClick={() => {
                    onCopyMarkdown(report);
                  }}
                >
                  <ClipboardCopyIcon className="size-4" />
                  Copy as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onDownloadMarkdown(report);
                  }}
                >
                  <FileDownIcon className="size-4" />
                  Download Markdown
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    onDelete(report);
                  }}
                >
                  <Trash2Icon className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {summarySnippet}
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground/60">
          {formatRelativeDate(report.savedAt)}
        </p>
      </CardContent>
    </Card>
  );
}

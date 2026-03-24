import type { WatchlistItem } from "@capyfin/contracts";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export type SortColumn = "ticker" | "addedAt";
export type SortDirection = "asc" | "desc";

interface WatchlistTableProps {
  items: WatchlistItem[];
  sortBy: SortColumn;
  sortDir: SortDirection;
  onSort: (col: SortColumn) => void;
  onEdit: (item: WatchlistItem) => void;
  onDelete: (ticker: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SortIndicator({
  column,
  sortBy,
  sortDir,
}: {
  column: SortColumn;
  sortBy: SortColumn;
  sortDir: SortDirection;
}) {
  if (column !== sortBy) return null;
  return sortDir === "asc" ? (
    <ChevronUpIcon className="inline size-3.5" />
  ) : (
    <ChevronDownIcon className="inline size-3.5" />
  );
}

export function WatchlistTable({
  items,
  sortBy,
  sortDir,
  onSort,
  onEdit,
  onDelete,
}: WatchlistTableProps) {
  return (
    <Card className="overflow-hidden border border-border/60 shadow-sm">
      <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Watchlist</CardTitle>
            <CardDescription className="mt-0.5">
              {items.length} {items.length === 1 ? "ticker" : "tickers"} tracked
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/40 bg-muted/20 hover:bg-muted/20">
              <TableHead className="h-9 pl-5">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                  onClick={() => {
                    onSort("ticker");
                  }}
                >
                  Ticker
                  <SortIndicator
                    column="ticker"
                    sortBy={sortBy}
                    sortDir={sortDir}
                  />
                </button>
              </TableHead>
              <TableHead className="h-9">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  List
                </span>
              </TableHead>
              <TableHead className="h-9 max-w-[200px]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Note
                </span>
              </TableHead>
              <TableHead className="h-9">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Tags
                </span>
              </TableHead>
              <TableHead className="h-9">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                  onClick={() => {
                    onSort("addedAt");
                  }}
                >
                  Added
                  <SortIndicator
                    column="addedAt"
                    sortBy={sortBy}
                    sortDir={sortDir}
                  />
                </button>
              </TableHead>
              <TableHead className="h-9 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.ticker}
                className="group/row border-b border-border/30 transition-colors hover:bg-muted/30"
              >
                <TableCell className="pl-5">
                  <span className="inline-flex items-center rounded-md bg-foreground/[0.04] px-2 py-0.5 font-mono text-[13px] font-semibold tracking-wide text-foreground dark:bg-foreground/[0.06]">
                    {item.ticker}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      item.list === "position"
                        ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-600 dark:text-emerald-400"
                        : "border-blue-500/30 bg-blue-500/[0.06] text-blue-600 dark:text-blue-400"
                    }
                  >
                    {item.list === "position" ? "Position" : "Watching"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {item.note ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.tags?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[11px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-muted-foreground">
                  {formatDate(item.addedAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100"
                      >
                        <MoreHorizontalIcon className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          onEdit(item);
                        }}
                      >
                        <PencilIcon className="size-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          onDelete(item.ticker);
                        }}
                      >
                        <TrashIcon className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

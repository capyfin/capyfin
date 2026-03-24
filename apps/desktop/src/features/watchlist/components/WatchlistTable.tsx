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
    <Card className="border border-border/70 bg-card/92 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.4)]">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Watchlist</CardTitle>
        <CardDescription>
          {items.length} {items.length === 1 ? "ticker" : "tickers"} tracked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <Table>
            <TableHeader className="bg-muted/45">
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center gap-1 font-medium"
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
                <TableHead>List</TableHead>
                <TableHead className="max-w-[200px]">Note</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center gap-1 font-medium"
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
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.ticker}>
                  <TableCell className="font-medium">{item.ticker}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.list === "position" ? "Position" : "Watching"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="block truncate text-muted-foreground">
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
                  <TableCell className="text-muted-foreground">
                    {formatDate(item.addedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground"
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
        </div>
      </CardContent>
    </Card>
  );
}

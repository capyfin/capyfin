import type { InvestmentCase, WatchlistItem } from "@capyfin/contracts";
import {
  BookOpenIcon,
  CalculatorIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileBarChart2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusCircleIcon,
  RefreshCwIcon,
  ScaleIcon,
  SearchIcon,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { StanceBadge } from "@/features/cases/components/StanceBadge";
import { getCaseStatus } from "@/features/launchpad/case-lookup";
import type { ActionCard } from "@/features/launchpad/types";
import { WATCHLIST_CARD_ACTIONS } from "@/features/watchlist/get-watchlist-card-actions";

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const CARD_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "deep-dive": SearchIcon,
  "fair-value": CalculatorIcon,
  "earnings-xray": FileBarChart2Icon,
  "bull-bear": ScaleIcon,
  "position-review": SearchIcon,
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export type SortColumn = "ticker" | "addedAt";
export type SortDirection = "asc" | "desc";

interface WatchlistTableProps {
  items: WatchlistItem[];
  sortBy: SortColumn;
  sortDir: SortDirection;
  onSort: (col: SortColumn) => void;
  onEdit: (item: WatchlistItem) => void;
  onDelete: (ticker: string) => void;
  onCardAction?: ((card: ActionCard, ticker: string) => void) | undefined;
  caseMap?: Map<string, InvestmentCase>;
  onViewCase?: ((caseId: string) => void) | undefined;
  onCreateCase?: ((ticker: string) => void) | undefined;
  onRefreshCase?: ((ticker: string) => void) | undefined;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatReviewAge(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  return `${String(days)}d ago`;
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
  onCardAction,
  caseMap,
  onViewCase,
  onCreateCase,
  onRefreshCase,
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
              {caseMap ? (
                <TableHead className="h-9">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Case
                  </span>
                </TableHead>
              ) : null}
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
                {caseMap ? (
                  <TableCell>
                    {(() => {
                      const status = getCaseStatus(item.ticker, caseMap);
                      if (!status.hasCase) {
                        return (
                          <span className="text-[12px] text-muted-foreground/50">
                            No case
                          </span>
                        );
                      }
                      return (
                        <div className="flex items-center gap-1.5">
                          {status.stance ? (
                            <StanceBadge
                              stance={status.stance}
                              className="text-[10px] px-1.5 py-0"
                            />
                          ) : null}
                          {status.confidence ? (
                            <ConfidenceBadge
                              confidence={status.confidence}
                              className="text-[10px] px-1.5 py-0"
                            />
                          ) : null}
                          {status.daysSinceReview !== undefined ? (
                            <span
                              className={`text-[11px] ${status.isStale ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/60"}`}
                            >
                              {formatReviewAge(status.daysSinceReview)}
                            </span>
                          ) : null}
                        </div>
                      );
                    })()}
                  </TableCell>
                ) : null}
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
                    <DropdownMenuContent align="end" className="w-48">
                      {caseMap ? (
                        <>
                          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                            Case Actions
                          </DropdownMenuLabel>
                          {(() => {
                            const status = getCaseStatus(item.ticker, caseMap);
                            const caseId = status.caseId;
                            if (status.hasCase && caseId) {
                              return (
                                <>
                                  {onViewCase ? (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        onViewCase(caseId);
                                      }}
                                    >
                                      <BookOpenIcon className="size-3.5" />
                                      View Case
                                    </DropdownMenuItem>
                                  ) : null}
                                  {onRefreshCase ? (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        onRefreshCase(item.ticker);
                                      }}
                                    >
                                      <RefreshCwIcon className="size-3.5" />
                                      Refresh Case
                                    </DropdownMenuItem>
                                  ) : null}
                                </>
                              );
                            }
                            return onCreateCase ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  onCreateCase(item.ticker);
                                }}
                              >
                                <PlusCircleIcon className="size-3.5" />
                                Create Case
                              </DropdownMenuItem>
                            ) : null;
                          })()}
                          <DropdownMenuSeparator />
                        </>
                      ) : null}
                      {onCardAction && (
                        <>
                          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                            Run Analysis
                          </DropdownMenuLabel>
                          {WATCHLIST_CARD_ACTIONS.map((card) => {
                            const Icon = CARD_ICON_MAP[card.id];
                            return (
                              <DropdownMenuItem
                                key={card.id}
                                onClick={() => {
                                  onCardAction(card, item.ticker);
                                }}
                              >
                                {Icon ? <Icon className="size-3.5" /> : null}
                                {card.title}
                              </DropdownMenuItem>
                            );
                          })}
                          <DropdownMenuSeparator />
                        </>
                      )}
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

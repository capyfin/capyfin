import type { InvestmentCase, PortfolioHolding } from "@capyfin/contracts";
import { TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { AttentionBadge } from "@/features/cases/components/AttentionBadge";
import { StanceBadge } from "@/features/cases/components/StanceBadge";
import { getCaseStatus } from "@/features/launchpad/case-lookup";
import type { ActionCard } from "@/features/launchpad/types";
import { TickerLink } from "@/features/ticker-actions/TickerLink";

interface HoldingsTableProps {
  holdings: PortfolioHolding[];
  caseMap?: Map<string, InvestmentCase>;
  onRemove: (ticker: string) => void;
  onTickerAction?: (card: ActionCard, ticker: string) => void;
  onCreateCase?: ((ticker: string) => void) | undefined;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatReviewAge(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  return `${String(days)}d ago`;
}

export function HoldingsTable({
  holdings,
  caseMap,
  onRemove,
  onTickerAction,
  onCreateCase,
}: HoldingsTableProps) {
  return (
    <Card className="overflow-hidden rounded-xl border border-border/50 shadow-sm dark:border-border/40">
      <CardHeader className="border-b border-border/40 bg-muted/20 pb-4 dark:bg-muted/10">
        <CardTitle className="text-[15px] font-semibold tracking-tight">
          Holdings
        </CardTitle>
        <CardDescription className="mt-0.5 text-[13px]">
          Positions sorted by portfolio weight. Cost-basis-derived values.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/40 bg-muted/15 hover:bg-muted/15 dark:bg-muted/8">
                <TableHead className="h-9 pl-5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                    Ticker
                  </span>
                </TableHead>
                <TableHead className="h-9">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                    Shares
                  </span>
                </TableHead>
                <TableHead className="h-9">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                    Cost Basis
                  </span>
                </TableHead>
                <TableHead className="h-9">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                    Value
                  </span>
                </TableHead>
                <TableHead className="h-9">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                    Weight
                  </span>
                </TableHead>
                <TableHead className="h-9">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                    Sector
                  </span>
                </TableHead>
                {caseMap ? (
                  <TableHead className="h-9">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                      Case
                    </span>
                  </TableHead>
                ) : null}
                <TableHead className="h-9 w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...holdings]
                .sort((a, b) => b.weight - a.weight)
                .map((holding) => (
                  <TableRow
                    key={holding.ticker}
                    className="group/row border-b border-border/25 transition-colors hover:bg-muted/30 dark:border-border/20"
                  >
                    <TableCell className="pl-5">
                      <div>
                        {onTickerAction ? (
                          <TickerLink
                            ticker={holding.ticker}
                            onAction={onTickerAction}
                          />
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-foreground/[0.05] px-2.5 py-0.5 font-mono text-sm font-bold tracking-wide text-foreground dark:bg-foreground/[0.07]">
                            {holding.ticker}
                          </span>
                        )}
                        {holding.name ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {holding.name}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {holding.shares}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(holding.costBasis)}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatCurrency(holding.shares * holding.costBasis)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {holding.weight.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {holding.sector ?? (
                        <span className="italic text-muted-foreground/50">
                          Not set
                        </span>
                      )}
                    </TableCell>
                    {caseMap ? (
                      <TableCell>
                        {(() => {
                          const status = getCaseStatus(holding.ticker, caseMap);
                          if (!status.hasCase) {
                            return onCreateCase ? (
                              <button
                                type="button"
                                className="text-[12px] text-muted-foreground/50 transition-colors hover:text-foreground"
                                onClick={() => {
                                  onCreateCase(holding.ticker);
                                }}
                              >
                                + Create case
                              </button>
                            ) : (
                              <span className="text-[12px] text-muted-foreground/50">
                                No case
                              </span>
                            );
                          }
                          return (
                            <div className="flex flex-wrap items-center gap-1.5">
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
                              {status.attentionState ? (
                                <AttentionBadge
                                  state={status.attentionState}
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
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground opacity-40 transition-opacity hover:text-destructive group-hover/row:opacity-100"
                        onClick={() => {
                          onRemove(holding.ticker);
                        }}
                        title={`Remove ${holding.ticker}`}
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
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

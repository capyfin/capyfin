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
import { StanceBadge } from "@/features/cases/components/StanceBadge";
import { getCaseStatus } from "@/features/launchpad/case-lookup";
import type { ActionCard } from "@/features/launchpad/types";
import { TickerLink } from "@/features/ticker-actions/TickerLink";

interface HoldingsTableProps {
  holdings: PortfolioHolding[];
  caseMap?: Map<string, InvestmentCase>;
  onRemove: (ticker: string) => void;
  onTickerAction?: (card: ActionCard, ticker: string) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function HoldingsTable({
  holdings,
  caseMap,
  onRemove,
  onTickerAction,
}: HoldingsTableProps) {
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm dark:border-border/30">
      <CardHeader className="border-b border-border/40 bg-muted/20 dark:bg-muted/10">
        <CardTitle className="text-[17px] font-semibold tracking-tight">
          Holdings
        </CardTitle>
        <CardDescription className="text-[13px]">
          Positions sorted by portfolio weight. Cost-basis-derived values.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div>
          <Table>
            <TableHeader className="bg-muted/15 dark:bg-muted/8">
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Cost Basis</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Sector</TableHead>
                {caseMap ? <TableHead>Case</TableHead> : null}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...holdings]
                .sort((a, b) => b.weight - a.weight)
                .map((holding) => (
                  <TableRow key={holding.ticker}>
                    <TableCell>
                      <div>
                        {onTickerAction ? (
                          <TickerLink
                            ticker={holding.ticker}
                            onAction={onTickerAction}
                          />
                        ) : (
                          <p className="font-medium">{holding.ticker}</p>
                        )}
                        {holding.name ? (
                          <p className="text-xs text-muted-foreground">
                            {holding.name}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{holding.shares}</TableCell>
                    <TableCell>{formatCurrency(holding.costBasis)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(holding.shares * holding.costBasis)}
                    </TableCell>
                    <TableCell>{holding.weight.toFixed(1)}%</TableCell>
                    <TableCell className="text-muted-foreground">
                      {holding.sector ?? "--"}
                    </TableCell>
                    {caseMap ? (
                      <TableCell>
                        {(() => {
                          const status = getCaseStatus(holding.ticker, caseMap);
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
                            </div>
                          );
                        })()}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
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

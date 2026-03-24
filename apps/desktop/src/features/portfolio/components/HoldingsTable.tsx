import type { PortfolioHolding } from "@capyfin/contracts";
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

interface HoldingsTableProps {
  holdings: PortfolioHolding[];
  onRemove: (ticker: string) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function HoldingsTable({ holdings, onRemove }: HoldingsTableProps) {
  return (
    <Card className="border border-border/70 bg-card/92 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.4)]">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Holdings</CardTitle>
        <CardDescription>
          Positions sorted by portfolio weight. Cost-basis-derived values.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <Table>
            <TableHeader className="bg-muted/45">
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Cost Basis</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Sector</TableHead>
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
                        <p className="font-medium">{holding.ticker}</p>
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

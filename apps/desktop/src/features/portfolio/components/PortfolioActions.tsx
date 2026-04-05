import type { LucideIcon } from "lucide-react";
import { BarChart3Icon, GitCompareArrowsIcon, SearchIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActionCard } from "@/features/launchpad/types";
import { portfolioCards } from "@/features/launchpad/card-registry";

interface PortfolioActionsProps {
  onCardClick: (card: ActionCard, input?: string) => void;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const ICONS: Record<string, LucideIcon> = {
  "portfolio-analysis": BarChart3Icon,
  "position-review": SearchIcon,
  "benchmark-comparison": GitCompareArrowsIcon,
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function PortfolioActions({ onCardClick }: PortfolioActionsProps) {
  return (
    <Card className="border-border/50 shadow-sm dark:border-border/30">
      <CardHeader>
        <CardTitle className="text-[17px] font-semibold tracking-tight">
          Quick Actions
        </CardTitle>
        <CardDescription className="text-[13px]">
          Run portfolio analysis, review positions, or compare benchmarks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {portfolioCards.map((card) => {
            /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
            const Icon = ICONS[card.id] ?? BarChart3Icon;
            /* eslint-enable @typescript-eslint/no-unsafe-assignment */
            return (
              <button
                type="button"
                key={card.id}
                className="cursor-pointer rounded-lg border border-border/70 bg-card/92 p-5 text-left transition-colors hover:border-border hover:bg-accent/50"
                onClick={() => {
                  onCardClick(card);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-2 ring-primary/[0.06]">
                    <Icon className="size-4.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{card.title}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground line-clamp-2">
                      {card.promise}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

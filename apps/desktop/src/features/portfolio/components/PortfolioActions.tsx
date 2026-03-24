import type { LucideIcon } from "lucide-react";
import { BarChart3Icon, GitCompareArrowsIcon, SearchIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Quick Actions
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {portfolioCards.map((card) => {
          /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
          const Icon = ICONS[card.id] ?? BarChart3Icon;
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          return (
            <Card
              key={card.id}
              className="cursor-pointer border border-border/70 bg-card/92 transition-colors hover:border-border hover:bg-accent/50"
              onClick={() => {
                onCardClick(card);
              }}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{card.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {card.promise}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

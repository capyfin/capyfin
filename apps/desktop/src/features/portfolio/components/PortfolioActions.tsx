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
    <Card className="overflow-hidden rounded-xl border-border/50 shadow-sm dark:border-border/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/[0.08] text-primary ring-1 ring-primary/10">
            <BarChart3Icon className="size-4" />
          </div>
          <div>
            <CardTitle className="text-[15px] font-semibold tracking-tight">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-[12px] text-muted-foreground/70">
              Run portfolio workflows
            </CardDescription>
          </div>
        </div>
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
                className="cursor-pointer rounded-xl border border-border/50 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-border/70 hover:bg-muted/30 hover:shadow-md hover:shadow-black/[0.03] dark:hover:shadow-black/20"
                onClick={() => {
                  onCardClick(card);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] ring-1 ring-primary/[0.06]">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold">{card.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
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

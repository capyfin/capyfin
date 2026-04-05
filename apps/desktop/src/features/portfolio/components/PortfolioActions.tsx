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
const CARD_META: Record<
  string,
  {
    icon: LucideIcon;
    color: string;
    bg: string;
    ring: string;
    border: string;
    gradient: string;
  }
> = {
  "portfolio-analysis": {
    icon: BarChart3Icon,
    color: "text-blue-500",
    bg: "bg-blue-500/[0.08]",
    ring: "ring-blue-500/10",
    border: "border-l-blue-500/60",
    gradient:
      "bg-gradient-to-r from-blue-500/[0.05] via-transparent to-transparent dark:from-blue-500/[0.07]",
  },
  "position-review": {
    icon: SearchIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/[0.08]",
    ring: "ring-emerald-500/10",
    border: "border-l-emerald-500/60",
    gradient:
      "bg-gradient-to-r from-emerald-500/[0.05] via-transparent to-transparent dark:from-emerald-500/[0.07]",
  },
  "benchmark-comparison": {
    icon: GitCompareArrowsIcon,
    color: "text-violet-500",
    bg: "bg-violet-500/[0.08]",
    ring: "ring-violet-500/10",
    border: "border-l-violet-500/60",
    gradient:
      "bg-gradient-to-r from-violet-500/[0.05] via-transparent to-transparent dark:from-violet-500/[0.07]",
  },
};

const DEFAULT_META = {
  icon: BarChart3Icon,
  color: "text-primary",
  bg: "bg-primary/[0.08]",
  ring: "ring-primary/10",
  border: "border-l-primary/60",
  gradient:
    "bg-gradient-to-r from-primary/[0.05] via-transparent to-transparent",
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
            const meta = CARD_META[card.id] ?? DEFAULT_META;
            const Icon = meta.icon;
            /* eslint-enable @typescript-eslint/no-unsafe-assignment */
            return (
              <button
                type="button"
                key={card.id}
                className={`cursor-pointer rounded-xl border border-border/50 border-l-2 ${meta.border} ${meta.gradient} p-4 text-left transition-all hover:-translate-y-0.5 hover:border-border/70 hover:shadow-md hover:shadow-black/[0.03] dark:border-border/30 dark:hover:shadow-black/20`}
                onClick={() => {
                  onCardClick(card);
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ${meta.bg} ${meta.ring}`}
                  >
                    <Icon className={`size-4 ${meta.color}`} />
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

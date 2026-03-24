import { useState, type KeyboardEvent, type SyntheticEvent } from "react";
import {
  Activity,
  ArrowRight,
  Calculator,
  DollarSign,
  Eye,
  FileBarChart,
  Newspaper,
  Scale,
  Search,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ActionCard,
  ActionCategory,
  CardInputMode,
  EstimatedDuration,
} from "../types";

const inputLabel: Record<CardInputMode, string> = {
  none: "No input",
  ticker: "Ticker",
  tickers: "Tickers",
  preferences: "Preferences",
  upload: "Upload",
};

const durationLabel: Record<EstimatedDuration, string> = {
  fast: "Fast",
  medium: "Medium",
  deep: "Deep",
};

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const iconMap: Record<string, LucideIcon> = {
  Newspaper,
  Activity,
  Search,
  Calculator,
  FileBarChart,
  Scale,
  TrendingUp,
  Zap,
  Eye,
  DollarSign,
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

const categoryAccent: Record<
  ActionCategory,
  { bg: string; text: string; border: string }
> = {
  today: {
    bg: "bg-amber-500/8",
    text: "text-amber-500",
    border: "group-hover/card:border-l-amber-500/40",
  },
  research: {
    bg: "bg-blue-500/8",
    text: "text-blue-500",
    border: "group-hover/card:border-l-blue-500/40",
  },
  setups: {
    bg: "bg-emerald-500/8",
    text: "text-emerald-500",
    border: "group-hover/card:border-l-emerald-500/40",
  },
  income: {
    bg: "bg-violet-500/8",
    text: "text-violet-500",
    border: "group-hover/card:border-l-violet-500/40",
  },
  portfolio: {
    bg: "bg-amber-500/8",
    text: "text-amber-500",
    border: "group-hover/card:border-l-amber-500/40",
  },
};

interface ActionCardItemProps {
  card: ActionCard;
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
}

export function ActionCardItem({ card, onCardClick }: ActionCardItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tickerValue, setTickerValue] = useState("");

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-redundant-type-constituents -- dynamic icon lookup from lucide-react */
  const Icon: LucideIcon | undefined = iconMap[card.icon];
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-redundant-type-constituents */
  const needsInput = card.input === "ticker" || card.input === "tickers";
  const isTodayCard = card.category === "today";
  const accent = categoryAccent[card.category];

  function handleCardClick() {
    if (needsInput) {
      setIsExpanded(true);
    } else {
      onCardClick?.(card);
    }
  }

  function handleSubmit(e?: SyntheticEvent) {
    e?.preventDefault();
    const trimmed = tickerValue.trim().toUpperCase();
    if (!trimmed) return;
    onCardClick?.(card, trimmed);
    setTickerValue("");
    setIsExpanded(false);
  }

  function handleInputKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      setIsExpanded(false);
      setTickerValue("");
    }
  }

  return (
    <Card
      data-card-id={card.id}
      size="sm"
      className={cn(
        "cursor-pointer gap-3 border-l-2 border-l-transparent py-0 ring-foreground/8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/[0.03] hover:ring-foreground/18 dark:hover:shadow-black/20",
        accent.border,
        isTodayCard && "bg-amber-500/[0.03] dark:bg-amber-500/[0.05]",
        isExpanded &&
          "ring-primary/40 hover:translate-y-0 hover:ring-primary/40",
      )}
      onClick={!isExpanded ? handleCardClick : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !isExpanded) handleCardClick();
      }}
    >
      <div className="flex items-start gap-3.5 px-4 pt-4 group-data-[size=sm]/card:px-3 group-data-[size=sm]/card:pt-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            accent.bg,
            accent.text,
          )}
        >
          {Icon ? <Icon className="size-4.5" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug text-foreground">
            {card.title}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            {card.promise}
          </p>
        </div>
      </div>

      {/* metadata row */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-0.5 group-data-[size=sm]/card:px-3 group-data-[size=sm]/card:pb-2.5">
        <span className="text-[11px] text-muted-foreground">
          {inputLabel[card.input]}
        </span>
        <span className="text-[10px] text-muted-foreground/40">·</span>
        <span className="text-[11px] text-muted-foreground">
          {durationLabel[card.estimatedDuration]}
        </span>
      </div>

      {isExpanded && needsInput ? (
        <form
          className="flex items-center gap-2 px-4 pb-3.5 group-data-[size=sm]/card:px-3 group-data-[size=sm]/card:pb-3"
          onSubmit={handleSubmit}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Input
            autoFocus
            placeholder={
              card.input === "tickers"
                ? "Enter tickers to scan (e.g. NVDA, AAPL)"
                : "Enter ticker (e.g. NVDA)"
            }
            className="h-8 flex-1 text-[13px] uppercase"
            value={tickerValue}
            onChange={(e) => {
              setTickerValue(e.target.value);
            }}
            onKeyDown={handleInputKeyDown}
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 shrink-0 rounded-md px-3 text-[12px]"
            disabled={!tickerValue.trim()}
          >
            <ArrowRight className="size-3.5" />
          </Button>
        </form>
      ) : null}
    </Card>
  );
}

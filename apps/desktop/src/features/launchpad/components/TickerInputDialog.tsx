import { useState, useCallback, type KeyboardEvent } from "react";
import { ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionCard } from "../types";

interface TickerInputDialogProps {
  card: ActionCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (card: ActionCard, ticker: string) => void;
}

export function TickerInputDialog({
  card,
  open,
  onOpenChange,
  onSubmit,
}: TickerInputDialogProps) {
  const [ticker, setTicker] = useState("");

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setTicker("");
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleSubmit = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.preventDefault();
      const trimmed = ticker.trim().toUpperCase();
      if (!trimmed || !card) return;
      onSubmit(card, trimmed);
      setTicker("");
      onOpenChange(false);
    },
    [card, ticker, onSubmit, onOpenChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose(false);
      }
    },
    [handleClose],
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{card?.title ?? "Enter Ticker"}</DialogTitle>
          <DialogDescription>
            {card?.promise ?? "Enter a ticker symbol to continue."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            autoFocus
            placeholder={
              card?.input === "tickers"
                ? "Enter tickers (e.g. NVDA, AAPL)"
                : "Enter ticker (e.g. NVDA)"
            }
            className="h-9 flex-1 text-[13px] uppercase"
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 shrink-0 rounded-md px-3"
            disabled={!ticker.trim()}
          >
            <ArrowRight className="size-3.5" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import type { PortfolioOverview } from "@capyfin/contracts";
import { LoaderCircleIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { SidecarClient } from "@/lib/sidecar/client";

interface AddHoldingDialogProps {
  client: SidecarClient;
  open: boolean;
  onClose: () => void;
  onAddComplete: (overview: PortfolioOverview) => void;
}

export function AddHoldingDialog({
  client,
  open,
  onClose,
  onAddComplete,
}: AddHoldingDialogProps) {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setTicker("");
    setShares("");
    setCostBasis("");
    setName("");
    setSector("");
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!ticker.trim() || !shares.trim() || !costBasis.trim()) {
      setError("Ticker, shares, and cost basis are required.");
      return;
    }

    const sharesNum = Number(shares);
    const costNum = Number(costBasis);
    if (!Number.isFinite(sharesNum) || sharesNum <= 0) {
      setError("Shares must be a positive number.");
      return;
    }
    if (!Number.isFinite(costNum) || costNum < 0) {
      setError("Cost basis must be a non-negative number.");
      return;
    }

    try {
      setIsAdding(true);
      setError(null);
      const overview = await client.addHolding({
        ticker: ticker.trim().toUpperCase(),
        shares: sharesNum,
        costBasis: costNum,
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(sector.trim() ? { sector: sector.trim() } : {}),
      });
      resetForm();
      onAddComplete(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add holding");
    } finally {
      setIsAdding(false);
    }
  }, [
    client,
    ticker,
    shares,
    costBasis,
    name,
    sector,
    resetForm,
    onAddComplete,
  ]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        resetForm();
        onClose();
      }
    },
    [resetForm, onClose],
  );

  const isValid =
    ticker.trim().length > 0 &&
    shares.trim().length > 0 &&
    costBasis.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Position</DialogTitle>
          <DialogDescription>
            Manually add a holding to your portfolio.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="holding-ticker"
              className="text-xs font-medium text-muted-foreground"
            >
              Ticker *
            </label>
            <Input
              id="holding-ticker"
              placeholder="e.g. AAPL"
              value={ticker}
              onChange={(e) => {
                setTicker(e.target.value);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="holding-shares"
                className="text-xs font-medium text-muted-foreground"
              >
                Shares *
              </label>
              <Input
                id="holding-shares"
                type="number"
                placeholder="100"
                min="0"
                step="any"
                value={shares}
                onChange={(e) => {
                  setShares(e.target.value);
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="holding-cost"
                className="text-xs font-medium text-muted-foreground"
              >
                Cost Basis *
              </label>
              <Input
                id="holding-cost"
                type="number"
                placeholder="150.00"
                min="0"
                step="any"
                value={costBasis}
                onChange={(e) => {
                  setCostBasis(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="holding-name"
              className="text-xs font-medium text-muted-foreground"
            >
              Name
            </label>
            <Input
              id="holding-name"
              placeholder="Apple Inc (optional)"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="holding-sector"
              className="text-xs font-medium text-muted-foreground"
            >
              Sector
            </label>
            <Input
              id="holding-sector"
              placeholder="Technology (optional)"
              value={sector}
              onChange={(e) => {
                setSector(e.target.value);
              }}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!isValid || isAdding}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {isAdding ? (
              <LoaderCircleIcon className="size-3.5 animate-spin" />
            ) : null}
            {isAdding ? "Adding..." : "Add Position"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

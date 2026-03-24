import type { PortfolioOverview } from "@capyfin/contracts";
import { LoaderCircleIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { SidecarClient } from "@/lib/sidecar/client";
import type { ActionCard } from "@/features/launchpad/types";
import { PortfolioEmptyState } from "./PortfolioEmptyState";
import { PortfolioOverviewPanel } from "./PortfolioOverviewPanel";
import { HoldingsTable } from "./HoldingsTable";
import { SectorExposure } from "./SectorExposure";
import { ConcentrationAlerts } from "./ConcentrationAlerts";
import { PortfolioActions } from "./PortfolioActions";
import { CsvImportDialog } from "./CsvImportDialog";
import { AddHoldingDialog } from "./AddHoldingDialog";

export const PORTFOLIO_EMPTY_TEXT =
  "No portfolio data yet. Import your holdings to see allocation summaries, sector exposure, and concentration alerts.";

interface PortfolioWorkspaceProps {
  client: SidecarClient | null;
  onCardClick: (card: ActionCard, input?: string) => void;
}

export function PortfolioWorkspace({
  client,
  onCardClick,
}: PortfolioWorkspaceProps) {
  const [portfolio, setPortfolio] = useState<PortfolioOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showAddHolding, setShowAddHolding] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      setError(null);
      const overview = await client.getPortfolio();
      setPortfolio(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchPortfolio();
  }, [fetchPortfolio]);

  const handleImportComplete = useCallback((overview: PortfolioOverview) => {
    setPortfolio(overview);
    setShowImport(false);
  }, []);

  const handleAddHoldingComplete = useCallback(
    (overview: PortfolioOverview) => {
      setPortfolio(overview);
      setShowAddHolding(false);
    },
    [],
  );

  const handleRemoveHolding = useCallback(
    async (ticker: string) => {
      if (!client) return;
      await client.removeHolding(ticker);
      const updated = await client.getPortfolio();
      setPortfolio(updated);
    },
    [client],
  );

  if (!client) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Waiting for connection...
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const hasHoldings = portfolio !== null && portfolio.holdings.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
      {hasHoldings ? (
        <>
          <PortfolioOverviewPanel
            portfolio={portfolio}
            onImport={() => {
              setShowImport(true);
            }}
            onAddHolding={() => {
              setShowAddHolding(true);
            }}
          />

          {portfolio.concentrationAlerts.length > 0 ? (
            <ConcentrationAlerts alerts={portfolio.concentrationAlerts} />
          ) : null}

          <HoldingsTable
            holdings={portfolio.holdings}
            onRemove={(ticker) => {
              void handleRemoveHolding(ticker);
            }}
          />

          {portfolio.sectorExposure.length > 0 ? (
            <SectorExposure sectors={portfolio.sectorExposure} />
          ) : null}

          <PortfolioActions onCardClick={onCardClick} />
        </>
      ) : (
        <PortfolioEmptyState
          onImport={() => {
            setShowImport(true);
          }}
          onAddHolding={() => {
            setShowAddHolding(true);
          }}
        />
      )}

      <CsvImportDialog
        client={client}
        open={showImport}
        onClose={() => {
          setShowImport(false);
        }}
        onImportComplete={handleImportComplete}
      />

      <AddHoldingDialog
        client={client}
        open={showAddHolding}
        onClose={() => {
          setShowAddHolding(false);
        }}
        onAddComplete={handleAddHoldingComplete}
      />
    </div>
  );
}

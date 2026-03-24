import { BriefcaseIcon, PlusIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { PORTFOLIO_EMPTY_TEXT } from "./PortfolioWorkspace";

interface PortfolioEmptyStateProps {
  onImport: () => void;
  onAddHolding: () => void;
}

export function PortfolioEmptyState({
  onImport,
  onAddHolding,
}: PortfolioEmptyStateProps) {
  return (
    <EmptyState
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
      icon={BriefcaseIcon}
      iconColor="emerald"
      heading="Track your portfolio"
      description={PORTFOLIO_EMPTY_TEXT}
    >
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onImport}>
          <UploadIcon className="size-3.5" />
          Import CSV
        </Button>
        <Button size="sm" onClick={onAddHolding}>
          <PlusIcon className="size-3.5" />
          Add Position
        </Button>
      </div>
    </EmptyState>
  );
}

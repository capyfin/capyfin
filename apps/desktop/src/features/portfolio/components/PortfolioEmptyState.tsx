import { BriefcaseIcon, PlusIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <BriefcaseIcon className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-[15px] font-semibold text-foreground">Portfolio</h2>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        {PORTFOLIO_EMPTY_TEXT}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onImport}>
          <UploadIcon className="size-3.5" />
          Import CSV
        </Button>
        <Button variant="outline" size="sm" onClick={onAddHolding}>
          <PlusIcon className="size-3.5" />
          Add Position
        </Button>
      </div>
    </div>
  );
}

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
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-20">
      <div className="relative">
        <div className="absolute -inset-3 rounded-2xl bg-emerald-500/[0.06] blur-xl dark:bg-emerald-500/[0.08]" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] dark:bg-emerald-500/[0.1]">
          <BriefcaseIcon className="size-6 text-emerald-500" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-[17px] font-semibold text-foreground">
          Track your portfolio
        </h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {PORTFOLIO_EMPTY_TEXT}
        </p>
      </div>
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
    </div>
  );
}

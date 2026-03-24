import type { SidecarClient } from "@/lib/sidecar/client";
import { FinancialDataSection } from "@/features/providers/components/FinancialDataSection";

interface FinancialDataTabProps {
  client: SidecarClient | null;
}

export function FinancialDataTab({ client }: FinancialDataTabProps) {
  return (
    <div className="flex flex-col gap-5" data-testid="financial-data-tab">
      <FinancialDataSection client={client} />
    </div>
  );
}

import { BriefcaseIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { CASES_EMPTY_TEXT } from "../constants";

interface CasesEmptyStateProps {
  onDeepDive: () => void;
}

export function CasesEmptyState({ onDeepDive }: CasesEmptyStateProps) {
  return (
    <EmptyState
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
      icon={BriefcaseIcon}
      iconColor="violet"
      heading="Build your first case"
      description={CASES_EMPTY_TEXT}
    >
      <Button size="sm" onClick={onDeepDive}>
        <SparklesIcon className="size-3.5" />
        Start a Deep Dive
      </Button>
    </EmptyState>
  );
}

import { GitCompareArrowsIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { COMPARISON_EMPTY_HEADING, COMPARISON_EMPTY_TEXT } from "../constants";

interface ComparisonEmptyStateProps {
  onDeepDive: () => void;
}

export function ComparisonEmptyState({
  onDeepDive,
}: ComparisonEmptyStateProps) {
  return (
    <EmptyState
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
      icon={GitCompareArrowsIcon}
      iconColor="blue"
      heading={COMPARISON_EMPTY_HEADING}
      description={COMPARISON_EMPTY_TEXT}
    >
      <Button size="sm" onClick={onDeepDive}>
        <SparklesIcon className="size-3.5" />
        Start a Deep Dive
      </Button>
    </EmptyState>
  );
}

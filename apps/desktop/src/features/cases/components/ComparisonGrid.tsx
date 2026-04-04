import type { AlignedSection } from "../comparison-utils";
import { ComparisonSectionRow } from "./ComparisonSectionRow";

interface ComparisonGridProps {
  alignedSections: AlignedSection[];
  leftLabel: string;
  rightLabel: string;
}

export function ComparisonGrid({
  alignedSections,
  leftLabel,
  rightLabel,
}: ComparisonGridProps) {
  if (alignedSections.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No sections to compare.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {alignedSections.map((aligned) => (
        <ComparisonSectionRow
          key={aligned.sectionId}
          aligned={aligned}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
        />
      ))}
    </div>
  );
}

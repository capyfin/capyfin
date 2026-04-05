import type { InvestmentCase } from "@capyfin/contracts";

type WorkflowType = "deep-dive" | "position-review" | "earnings-xray";

const workflowLabels: Record<WorkflowType, string> = {
  "deep-dive": "deep dive",
  "position-review": "position review",
  "earnings-xray": "earnings review",
};

/**
 * Build a human-readable summary of what changed between a prior case state
 * and an updated case state, including workflow context.
 */
export function buildChangeSummary(
  priorCase: InvestmentCase,
  updatedCase: InvestmentCase,
  workflowType: WorkflowType,
): string {
  const changes: string[] = [];

  if (priorCase.stance !== updatedCase.stance) {
    changes.push(
      `Stance changed from ${priorCase.stance} to ${updatedCase.stance}`,
    );
  }

  if (priorCase.confidence !== updatedCase.confidence) {
    changes.push(
      `Confidence changed from ${priorCase.confidence} to ${updatedCase.confidence}`,
    );
  }

  if (changes.length === 0) {
    return `Case updated via ${workflowType}`;
  }

  const label = workflowLabels[workflowType];
  return `${changes.join(". ")} after ${label}`;
}

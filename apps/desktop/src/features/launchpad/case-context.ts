import type { InvestmentCase } from "@capyfin/contracts";
import type { SidecarClient } from "@/lib/sidecar/client";

/**
 * Find the most recently reviewed case for a given ticker.
 * Returns null if no case exists.
 */
export async function findCaseByTicker(
  client: SidecarClient,
  ticker: string,
): Promise<InvestmentCase | null> {
  const { cases } = await client.listCases();
  const matches = cases.filter(
    (c) => c.ticker.toUpperCase() === ticker.toUpperCase(),
  );
  if (matches.length === 0) return null;

  // Return the most recently reviewed case
  const sorted = matches.sort(
    (a, b) =>
      new Date(b.lastReviewedAt).getTime() -
      new Date(a.lastReviewedAt).getTime(),
  );
  return sorted[0] ?? null;
}

/**
 * Format an Investment Case as a readable context block for injection
 * into the position-review agent prompt.
 */
export function formatCaseForPrompt(investmentCase: InvestmentCase): string {
  const lines: string[] = [];

  lines.push("## Prior Case State");
  lines.push("");
  lines.push(`**Ticker:** ${investmentCase.ticker}`);
  lines.push(`**Company:** ${investmentCase.companyName}`);
  lines.push(`**Stance:** ${investmentCase.stance}`);
  lines.push(`**Confidence:** ${investmentCase.confidence}`);
  const lastReviewedDate =
    new Date(investmentCase.lastReviewedAt).toISOString().split("T")[0] ?? "";
  const createdDate =
    new Date(investmentCase.createdAt).toISOString().split("T")[0] ?? "";
  lines.push(`**Last Reviewed:** ${lastReviewedDate}`);
  lines.push(`**Case Created:** ${createdDate}`);
  lines.push("");

  // Key assumptions
  if (investmentCase.keyAssumptions.length > 0) {
    lines.push("### Key Assumptions");
    for (const [i, assumption] of investmentCase.keyAssumptions.entries()) {
      lines.push(`${String(i + 1)}. ${assumption}`);
    }
    lines.push("");
  }

  // Invalidation signals
  if (investmentCase.invalidationSignals.length > 0) {
    lines.push("### Invalidation Signals");
    for (const signal of investmentCase.invalidationSignals) {
      lines.push(`- ${signal}`);
    }
    lines.push("");
  }

  // Section summaries
  for (const section of investmentCase.sections) {
    lines.push(`### ${section.title}`);
    // Truncate very long sections to keep context manageable
    const content =
      section.content.length > 2000
        ? `${section.content.slice(0, 2000)}\n[...truncated]`
        : section.content;
    lines.push(content);
    lines.push("");
  }

  // Next actions from prior case
  if (investmentCase.nextActions.length > 0) {
    lines.push("### Prior Next Actions");
    for (const action of investmentCase.nextActions) {
      lines.push(`- ${action}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

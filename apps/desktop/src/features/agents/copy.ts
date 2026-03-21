/**
 * Formats the agent count subtitle with correct singular/plural grammar.
 */
export function formatAgentCount(count: number): string {
  if (count === 0) {
    return "No custom agents yet.";
  }

  return `${String(count)} ${count === 1 ? "agent" : "agents"} available`;
}

/**
 * User-facing fallback description shown when an agent has no custom description.
 */
export const FALLBACK_AGENT_DESCRIPTION =
  "Your financial research assistant — analyzes markets, reads SEC filings, and tracks your watchlist.";

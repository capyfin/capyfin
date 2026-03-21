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

const DEV_AGENT_NAMES = new Set(["Main", "default", "assistant"]);

/**
 * Returns a user-friendly display name for the agent.
 * Replaces internal/dev-facing names with "CapyFin".
 */
export function getAgentDisplayName(name: string): string {
  return DEV_AGENT_NAMES.has(name) ? "CapyFin" : name;
}

const DEV_PATTERNS = [/orchestration/i, /workspace agent/i, /default agent/i];

/**
 * Returns true when the description looks like developer-facing jargon
 * that should be replaced with the user-facing fallback.
 */
export function isDevDescription(desc: string | undefined): boolean {
  if (!desc) return true;
  return DEV_PATTERNS.some((p) => p.test(desc));
}

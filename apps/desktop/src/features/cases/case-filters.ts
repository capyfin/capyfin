import type { InvestmentCase } from "@capyfin/contracts";

export type CasesFilterValue =
  | "all"
  | "holdings"
  | "watchlist"
  | "active"
  | "drift"
  | "stale"
  | "recent"
  | "archived";

export const CASES_FILTER_TABS: {
  value: CasesFilterValue;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "holdings", label: "Holdings" },
  { value: "watchlist", label: "Watchlist" },
  { value: "active", label: "Active" },
  { value: "drift", label: "Drift" },
  { value: "stale", label: "Stale" },
  { value: "recent", label: "Recently Updated" },
];

const RECENT_DAYS = 7;

/**
 * Filter cases by category. Holdings and watchlist filters use sets of
 * tickers from portfolio/watchlist data for cross-referencing.
 */
export function filterCases(
  cases: InvestmentCase[],
  filter: CasesFilterValue,
  holdingTickers: Set<string>,
  watchlistTickers: Set<string>,
): InvestmentCase[] {
  if (filter === "all") return cases;

  return cases.filter((c) => {
    const ticker = c.ticker.toUpperCase();

    switch (filter) {
      case "holdings":
        return holdingTickers.has(ticker);
      case "watchlist":
        return watchlistTickers.has(ticker);
      case "active":
        return c.attentionState === "healthy" || c.attentionState === undefined;
      case "drift":
        return c.attentionState === "drift-detected";
      case "stale":
        return (
          c.attentionState === "stale" || c.attentionState === "review-now"
        );
      case "recent": {
        const updatedAt = new Date(c.updatedAt).getTime();
        const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
        return updatedAt >= cutoff;
      }
      case "archived":
        return c.stance === "watching" && c.confidence === "LOW";
      default:
        return true;
    }
  });
}

/**
 * Returns a guidance message when a non-"all" filter has no matching cases,
 * or null if no guidance is needed.
 */
export function getCasesFilterGuidance(
  filter: CasesFilterValue,
  filteredCount: number,
  totalCount: number,
): string | null {
  if (filter === "all" || filteredCount > 0 || totalCount === 0) return null;

  switch (filter) {
    case "holdings":
      return "No cases match your portfolio holdings. Cases linked to positions you own appear here.";
    case "watchlist":
      return "No cases match your watchlist items. Cases linked to tickers you're watching appear here.";
    case "active":
      return "No active cases right now. Cases with healthy or monitoring state appear here.";
    case "drift":
      return "No cases with thesis drift detected. Cases where drift is flagged appear here.";
    case "stale":
      return "All caught up — no stale cases need attention.";
    case "recent":
      return "No cases updated in the last 7 days.";
    case "archived":
      return "No archived cases.";
    default:
      return null;
  }
}

import {
  WATCHLIST_NEAR_EMPTY_TEXT,
  WATCHLIST_NEAR_EMPTY_THRESHOLD,
} from "./WatchlistWorkspace";

type FilterValue = "all" | "position" | "watching" | "needs-review";

/**
 * Returns filter-aware guidance text for the watchlist footer,
 * or null if no guidance should be shown.
 */
export function getFilterGuidance(
  filter: FilterValue,
  filteredCount: number,
  totalCount: number,
): string | null {
  // When a non-"all" filter is active and has no results, show filter-specific message
  if (filter !== "all" && filteredCount === 0 && totalCount > 0) {
    switch (filter) {
      case "position":
        return "No positions in your watchlist. Items linked to portfolio holdings appear here.";
      case "watching":
        return "No items in watching-only mode.";
      case "needs-review":
        return "All caught up — no items need review right now.";
    }
  }

  // When "all" filter is active and total items are below threshold, show generic guidance
  if (filter === "all" && totalCount < WATCHLIST_NEAR_EMPTY_THRESHOLD) {
    return WATCHLIST_NEAR_EMPTY_TEXT;
  }

  return null;
}

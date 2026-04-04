import type { InvestmentCase, WatchlistItem } from "@capyfin/contracts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StaleCase {
  id: string;
  ticker: string;
  companyName: string;
  stance: InvestmentCase["stance"];
  confidence: InvestmentCase["confidence"];
  daysSinceReview: number;
  lastReviewedAt: string;
}

export interface CatalystEntry {
  caseId: string;
  ticker: string;
  companyName: string;
  description: string;
}

export interface AttentionMetrics {
  staleCaseCount: number;
  confidenceChangeCount: number;
  watchlistSignalCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function daysBetween(dateStr: string, now: Date): number {
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Compute stale cases — sorted by staleness descending
// ---------------------------------------------------------------------------

export function computeStaleCases(
  cases: InvestmentCase[],
  thresholdDays = 30,
  now = new Date(),
): StaleCase[] {
  return cases
    .map((c) => ({
      id: c.id,
      ticker: c.ticker,
      companyName: c.companyName,
      stance: c.stance,
      confidence: c.confidence,
      daysSinceReview: daysBetween(c.lastReviewedAt, now),
      lastReviewedAt: c.lastReviewedAt,
    }))
    .filter((c) => c.daysSinceReview >= thresholdDays)
    .sort((a, b) => b.daysSinceReview - a.daysSinceReview);
}

// ---------------------------------------------------------------------------
// Compute cases with recent confidence changes
// ---------------------------------------------------------------------------

export function computeConfidenceChanges(
  cases: InvestmentCase[],
  withinDays = 30,
  now = new Date(),
): number {
  let count = 0;
  for (const c of cases) {
    for (const entry of c.history) {
      if (
        entry.priorConfidence &&
        entry.newConfidence &&
        entry.priorConfidence !== entry.newConfidence &&
        daysBetween(entry.date, now) <= withinDays
      ) {
        count++;
        break; // count each case once
      }
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Extract catalysts from case sections
// ---------------------------------------------------------------------------

export function extractCatalysts(
  cases: InvestmentCase[],
  limit = 5,
): CatalystEntry[] {
  const entries: CatalystEntry[] = [];
  for (const c of cases) {
    const catalystSection = c.sections.find(
      (s) => s.title.toLowerCase() === "catalysts",
    );
    if (catalystSection?.content.trim()) {
      entries.push({
        caseId: c.id,
        ticker: c.ticker,
        companyName: c.companyName,
        description: catalystSection.content.trim(),
      });
    }
  }
  return entries.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Compute watchlist signals — tickers with recent case activity
// ---------------------------------------------------------------------------

export function computeWatchlistSignals(
  watchlist: WatchlistItem[],
  cases: InvestmentCase[],
  withinDays = 7,
  now = new Date(),
): number {
  const watchTickers = new Set(watchlist.map((w) => w.ticker.toUpperCase()));
  let count = 0;
  for (const c of cases) {
    if (!watchTickers.has(c.ticker.toUpperCase())) continue;
    const hasRecent = c.history.some(
      (h) => daysBetween(h.date, now) <= withinDays,
    );
    if (hasRecent) count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Aggregate attention metrics
// ---------------------------------------------------------------------------

export function computeAttentionMetrics(
  cases: InvestmentCase[],
  watchlist: WatchlistItem[],
): AttentionMetrics {
  return {
    staleCaseCount: computeStaleCases(cases).length,
    confidenceChangeCount: computeConfidenceChanges(cases),
    watchlistSignalCount: computeWatchlistSignals(watchlist, cases),
  };
}

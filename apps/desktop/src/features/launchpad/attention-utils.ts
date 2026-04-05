import type {
  ConcentrationAlert,
  InvestmentCase,
  PortfolioOverview,
  WatchlistItem,
} from "@capyfin/contracts";

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

// ---------------------------------------------------------------------------
// Watchlist changes — items with recent case activity or drift signals
// ---------------------------------------------------------------------------

export interface WatchlistChange {
  ticker: string;
  note: string | undefined;
  changeType: "case-updated" | "stance-changed" | "confidence-changed";
  summary: string;
  daysAgo: number;
}

export function computeWatchlistChanges(
  watchlist: WatchlistItem[],
  cases: InvestmentCase[],
  withinDays = 14,
  now = new Date(),
): WatchlistChange[] {
  const caseMap = new Map<string, InvestmentCase>();
  for (const c of cases) {
    caseMap.set(c.ticker.toUpperCase(), c);
  }

  const changes: WatchlistChange[] = [];

  for (const item of watchlist) {
    const c = caseMap.get(item.ticker.toUpperCase());
    if (!c) continue;

    for (const entry of c.history) {
      const daysAgo = daysBetween(entry.date, now);
      if (daysAgo > withinDays) continue;

      if (
        entry.priorStance &&
        entry.newStance &&
        entry.priorStance !== entry.newStance
      ) {
        changes.push({
          ticker: item.ticker,
          note: item.note,
          changeType: "stance-changed",
          summary: `Stance changed from ${entry.priorStance} to ${entry.newStance}`,
          daysAgo,
        });
        break;
      }

      if (
        entry.priorConfidence &&
        entry.newConfidence &&
        entry.priorConfidence !== entry.newConfidence
      ) {
        changes.push({
          ticker: item.ticker,
          note: item.note,
          changeType: "confidence-changed",
          summary: `Confidence shifted from ${entry.priorConfidence} to ${entry.newConfidence}`,
          daysAgo,
        });
        break;
      }

      changes.push({
        ticker: item.ticker,
        note: item.note,
        changeType: "case-updated",
        summary: entry.summary,
        daysAgo,
      });
      break;
    }
  }

  return changes.sort((a, b) => a.daysAgo - b.daysAgo);
}

// ---------------------------------------------------------------------------
// Portfolio risks — extract concentration alerts from portfolio data
// ---------------------------------------------------------------------------

export interface PortfolioRiskSummary {
  concentrationAlerts: ConcentrationAlert[];
  positionsNeedingReview: number;
  topHoldingWeight: number;
  topHoldingTicker: string | null;
}

export function computePortfolioRisks(
  portfolio: PortfolioOverview | null,
  cases: InvestmentCase[],
  stalenessThreshold = 30,
  now = new Date(),
): PortfolioRiskSummary | null {
  if (!portfolio || portfolio.holdings.length === 0) return null;

  const holdingTickers = new Set(
    portfolio.holdings.map((h) => h.ticker.toUpperCase()),
  );

  let positionsNeedingReview = 0;
  for (const c of cases) {
    if (!holdingTickers.has(c.ticker.toUpperCase())) continue;
    if (daysBetween(c.lastReviewedAt, now) >= stalenessThreshold) {
      positionsNeedingReview++;
    }
  }

  const sorted = [...portfolio.holdings].sort((a, b) => b.weight - a.weight);
  const top = sorted[0];

  const isSinglePosition = portfolio.holdings.length <= 1;
  const filteredAlerts = portfolio.concentrationAlerts.filter(
    (a) =>
      !(a.type === "sector" && a.name === "Unclassified") &&
      !(isSinglePosition && a.type === "position"),
  );

  return {
    concentrationAlerts: filteredAlerts,
    positionsNeedingReview,
    topHoldingWeight: top ? top.weight : 0,
    topHoldingTicker: top ? top.ticker : null,
  };
}

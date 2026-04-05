import type {
  AttentionItem,
  AttentionState,
  InvestmentCase,
  PortfolioOverview,
  WatchlistItem,
} from "@capyfin/contracts";

export interface AttentionBullet {
  category: AttentionState | "review-queue";
  message: string;
  urgency: "high" | "medium" | "low";
}

export interface RecentUpdate {
  ticker: string;
  companyName: string;
  caseId: string;
  eventType: string;
  summary: string;
  date: string;
}

export interface UpcomingCatalyst {
  ticker: string;
  companyName: string;
  caseId: string;
  description: string;
  date: string;
  daysUntil: number;
}

const URGENCY_MAP: Record<string, "high" | "medium" | "low"> = {
  "review-now": "high",
  "drift-detected": "high",
  stale: "medium",
  "catalyst-upcoming": "medium",
  "review-soon": "low",
};

const LABEL_MAP: Record<string, (count: number) => string> = {
  "review-now": (n) =>
    `${String(n)} ${n === 1 ? "case needs" : "cases need"} review now`,
  "drift-detected": (n) =>
    `${String(n)} ${n === 1 ? "holding shows" : "holdings show"} thesis drift`,
  stale: (n) => `${String(n)} ${n === 1 ? "case is" : "cases are"} stale`,
  "catalyst-upcoming": (n) =>
    `${String(n)} upcoming ${n === 1 ? "catalyst" : "catalysts"} this week`,
  "review-soon": (n) =>
    `${String(n)} ${n === 1 ? "case" : "cases"} to review soon`,
};

const CATEGORY_ORDER: (AttentionState | "review-queue")[] = [
  "review-now",
  "drift-detected",
  "stale",
  "catalyst-upcoming",
  "review-soon",
  "review-queue",
];

export function buildAttentionBullets(
  items: AttentionItem[],
  reviewQueueCount: number,
): AttentionBullet[] {
  const active = items.filter((i) => !i.dismissed);

  const counts = new Map<string, number>();
  for (const item of active) {
    const state = item.attentionState;
    if (state === "healthy") continue;
    counts.set(state, (counts.get(state) ?? 0) + 1);
  }

  const bullets: AttentionBullet[] = [];

  for (const category of CATEGORY_ORDER) {
    if (bullets.length >= 5) break;

    if (category === "review-queue") {
      if (reviewQueueCount > 0) {
        bullets.push({
          category: "review-queue",
          message: `${String(reviewQueueCount)} ${reviewQueueCount === 1 ? "name" : "names"} in your review queue`,
          urgency: "low",
        });
      }
      continue;
    }

    const count = counts.get(category);
    if (!count) continue;

    const labelFn = LABEL_MAP[category];
    if (!labelFn) continue;

    bullets.push({
      category,
      message: labelFn(count),
      urgency: URGENCY_MAP[category] ?? "low",
    });
  }

  return bullets;
}

export function buildRecentUpdates(
  cases: InvestmentCase[],
  limit = 10,
): RecentUpdate[] {
  const all: RecentUpdate[] = [];

  for (const c of cases) {
    for (const h of c.history) {
      all.push({
        ticker: c.ticker,
        companyName: c.companyName,
        caseId: c.id,
        eventType: h.eventType,
        summary: h.summary,
        date: h.date,
      });
    }
  }

  all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return all.slice(0, limit);
}

export function buildUpcomingCatalysts(
  cases: InvestmentCase[],
  now = new Date(),
): UpcomingCatalyst[] {
  const catalysts: UpcomingCatalyst[] = [];
  const cutoff = 14;

  for (const c of cases) {
    if (!c.nextCatalystDate) continue;

    const catalystDate = new Date(c.nextCatalystDate);
    const diffMs = catalystDate.getTime() - now.getTime();
    const daysUntil = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysUntil < 0 || daysUntil > cutoff) continue;

    catalysts.push({
      ticker: c.ticker,
      companyName: c.companyName,
      caseId: c.id,
      description: c.nextCatalystDescription ?? "Upcoming catalyst",
      date: c.nextCatalystDate,
      daysUntil,
    });
  }

  catalysts.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return catalysts;
}

// ---------------------------------------------------------------------------
// Portfolio Alerts
// ---------------------------------------------------------------------------

export interface PortfolioAlert {
  type: "concentration" | "stale-position" | "sector-crowding";
  severity: "high" | "medium" | "low";
  message: string;
  ticker?: string | undefined;
}

const SEVERITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function daysSince(dateStr: string, now: Date): number {
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function buildPortfolioAlerts(
  portfolio: PortfolioOverview | null,
  cases: InvestmentCase[],
  now = new Date(),
): PortfolioAlert[] {
  if (!portfolio || portfolio.holdings.length === 0) return [];

  const alerts: PortfolioAlert[] = [];

  // Build a case lookup by ticker
  const caseMap = new Map<string, InvestmentCase>();
  for (const c of cases) {
    caseMap.set(c.ticker.toUpperCase(), c);
  }

  // 1. Concentration alerts — positions with high weight
  for (const alert of portfolio.concentrationAlerts) {
    if (alert.type === "position") {
      alerts.push({
        type: "concentration",
        severity: alert.weight >= 40 ? "high" : "medium",
        message: `${alert.name} is ${String(Math.round(alert.weight))}% of your portfolio`,
        ticker: alert.name,
      });
    }
  }

  // 2. Stale positions — holdings without recent case review or missing case
  const STALENESS_THRESHOLD = 30;
  for (const holding of portfolio.holdings) {
    const c = caseMap.get(holding.ticker.toUpperCase());
    if (!c) {
      alerts.push({
        type: "stale-position",
        severity: "medium",
        message: `${holding.ticker} has no investment case — consider creating one`,
        ticker: holding.ticker,
      });
    } else if (daysSince(c.lastReviewedAt, now) >= STALENESS_THRESHOLD) {
      const days = daysSince(c.lastReviewedAt, now);
      alerts.push({
        type: "stale-position",
        severity: days >= 60 ? "high" : "medium",
        message: `${holding.ticker} case not reviewed in ${String(days)} days`,
        ticker: holding.ticker,
      });
    }
  }

  // 3. Sector crowding — sectors with > 40% weight and multiple holdings
  const sectorHoldingCounts = new Map<string, number>();
  for (const h of portfolio.holdings) {
    if (h.sector) {
      const s = h.sector;
      sectorHoldingCounts.set(s, (sectorHoldingCounts.get(s) ?? 0) + 1);
    }
  }

  for (const alert of portfolio.concentrationAlerts) {
    if (alert.type === "sector") {
      const holdingCount = sectorHoldingCounts.get(alert.name) ?? 0;
      if (holdingCount >= 2) {
        alerts.push({
          type: "sector-crowding",
          severity: alert.weight >= 60 ? "high" : "medium",
          message: `${alert.name} sector is ${String(Math.round(alert.weight))}% of portfolio across ${String(holdingCount)} positions`,
          ticker: undefined,
        });
      }
    }
  }

  // Sort by severity (high first)
  alerts.sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2),
  );

  return alerts;
}

// ---------------------------------------------------------------------------
// Personalized Market Context
// ---------------------------------------------------------------------------

export interface MarketContextItem {
  type: "exposure-summary" | "sector-leadership" | "attention-summary";
  message: string;
}

export function buildMarketContext(
  portfolio: PortfolioOverview | null,
  watchlist: WatchlistItem[],
  cases: InvestmentCase[],
): MarketContextItem[] {
  const hasPortfolio = portfolio && portfolio.holdings.length > 0;
  const hasWatchlist = watchlist.length > 0;

  if (!hasPortfolio && !hasWatchlist) return [];

  const items: MarketContextItem[] = [];

  // 1. Exposure summary — what the user is tracking
  const holdingCount = portfolio?.holdings.length ?? 0;
  const watchingCount = watchlist.filter((w) => w.list === "watching").length;
  const totalNames = holdingCount + watchingCount;

  if (totalNames > 0) {
    const parts: string[] = [];
    if (holdingCount > 0) {
      parts.push(
        `${String(holdingCount)} ${holdingCount === 1 ? "holding" : "holdings"}`,
      );
    }
    if (watchingCount > 0) {
      parts.push(
        `${String(watchingCount)} watched ${watchingCount === 1 ? "name" : "names"}`,
      );
    }
    items.push({
      type: "exposure-summary",
      message: `Tracking ${parts.join(" and ")}`,
    });
  }

  // 2. Sector leadership from portfolio (exclude Unclassified)
  if (hasPortfolio && portfolio.sectorExposure.length > 0) {
    const realSectors = portfolio.sectorExposure.filter(
      (s) => s.sector !== "Unclassified",
    );
    const sorted = [...realSectors].sort((a, b) => b.weight - a.weight);
    const top = sorted[0];
    if (top && top.weight >= 20) {
      const secondPart =
        sorted.length > 1 && sorted[1] && sorted[1].weight >= 15
          ? `, followed by ${sorted[1].sector} at ${String(Math.round(sorted[1].weight))}%`
          : "";
      items.push({
        type: "sector-leadership",
        message: `Heaviest sector exposure: ${top.sector} at ${String(Math.round(top.weight))}%${secondPart}`,
      });
    }
  }

  // 3. Attention summary — how many of your names need attention
  const relevantTickers = new Set<string>();
  if (hasPortfolio) {
    for (const h of portfolio.holdings) {
      relevantTickers.add(h.ticker.toUpperCase());
    }
  }
  for (const w of watchlist) {
    relevantTickers.add(w.ticker.toUpperCase());
  }

  const attentionStates = new Set([
    "review-now",
    "drift-detected",
    "stale",
    "review-soon",
  ]);
  let needsAttention = 0;
  for (const c of cases) {
    if (
      relevantTickers.has(c.ticker.toUpperCase()) &&
      c.attentionState &&
      attentionStates.has(c.attentionState)
    ) {
      needsAttention++;
    }
  }

  if (needsAttention > 0) {
    items.push({
      type: "attention-summary",
      message: `${String(needsAttention)} of your ${String(relevantTickers.size)} names ${needsAttention === 1 ? "needs" : "need"} attention`,
    });
  }

  return items;
}

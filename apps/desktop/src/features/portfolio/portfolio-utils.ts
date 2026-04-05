import type { InvestmentCase, PortfolioOverview } from "@capyfin/contracts";

// ---------------------------------------------------------------------------
// Risk Markers
// ---------------------------------------------------------------------------

export interface RiskMarker {
  ticker: string;
  companyName: string;
  reason: string;
  severity: "high" | "medium" | "low";
}

function daysSince(dateStr: string, now: Date): number {
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Build a ranked list of risk markers for portfolio holdings based on case data.
 * Considers: missing cases, drift, staleness, low confidence, and high weight without review.
 */
export function buildRiskMarkers(
  portfolio: PortfolioOverview | null,
  cases: InvestmentCase[],
  now = new Date(),
): RiskMarker[] {
  if (!portfolio || portfolio.holdings.length === 0) return [];

  const caseMap = new Map<string, InvestmentCase>();
  for (const c of cases) {
    caseMap.set(c.ticker.toUpperCase(), c);
  }

  const markers: RiskMarker[] = [];

  for (const holding of portfolio.holdings) {
    const key = holding.ticker.toUpperCase();
    const investmentCase = caseMap.get(key);
    const name = holding.name ?? investmentCase?.companyName ?? holding.ticker;

    if (!investmentCase) {
      if (holding.weight >= 10) {
        markers.push({
          ticker: holding.ticker,
          companyName: name,
          reason: `${String(Math.round(holding.weight))}% position with no investment case`,
          severity: holding.weight >= 20 ? "high" : "medium",
        });
      }
      continue;
    }

    // Drift detected
    if (investmentCase.attentionState === "drift-detected") {
      markers.push({
        ticker: holding.ticker,
        companyName: name,
        reason: "Thesis drift detected",
        severity: "high",
      });
      continue;
    }

    // Review-now
    if (investmentCase.attentionState === "review-now") {
      markers.push({
        ticker: holding.ticker,
        companyName: name,
        reason: "Requires immediate review",
        severity: "high",
      });
      continue;
    }

    // Stale case with significant weight
    const days = daysSince(investmentCase.lastReviewedAt, now);
    if (days >= 30 && holding.weight >= 5) {
      markers.push({
        ticker: holding.ticker,
        companyName: name,
        reason: `Not reviewed in ${String(days)} days`,
        severity: days >= 60 ? "high" : "medium",
      });
      continue;
    }

    // Low confidence
    if (investmentCase.confidence === "LOW" && holding.weight >= 5) {
      markers.push({
        ticker: holding.ticker,
        companyName: name,
        reason: "Low confidence case",
        severity: "medium",
      });
    }
  }

  const SEVERITY_ORDER: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  markers.sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2),
  );

  return markers.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Market Regime Fit
// ---------------------------------------------------------------------------

export interface RegimeFitItem {
  type: "diversification" | "concentration-risk" | "review-health" | "exposure";
  message: string;
  sentiment: "positive" | "neutral" | "caution";
}

/**
 * Build brief commentary on how the portfolio aligns with current conditions.
 * Analyzes diversification, review health, and concentration.
 */
export function buildMarketRegimeFit(
  portfolio: PortfolioOverview | null,
  cases: InvestmentCase[],
  now = new Date(),
): RegimeFitItem[] {
  if (!portfolio || portfolio.holdings.length === 0) return [];

  const items: RegimeFitItem[] = [];

  // 1. Diversification assessment
  const realSectors = portfolio.sectorExposure.filter(
    (s) => s.sector !== "Unclassified",
  );
  if (realSectors.length >= 4) {
    items.push({
      type: "diversification",
      message: `Portfolio spans ${String(realSectors.length)} sectors — reasonable diversification`,
      sentiment: "positive",
    });
  } else if (realSectors.length >= 2) {
    items.push({
      type: "diversification",
      message: `Portfolio concentrated in ${String(realSectors.length)} sectors — limited diversification`,
      sentiment: "neutral",
    });
  } else if (portfolio.holdings.length > 1) {
    items.push({
      type: "diversification",
      message: "Portfolio lacks sector diversification",
      sentiment: "caution",
    });
  }

  // 2. Concentration risk
  const highConcentration = portfolio.concentrationAlerts.filter(
    (a) => a.type === "position" && a.weight >= 30,
  );
  if (highConcentration.length > 0) {
    const names = highConcentration.map((a) => a.name).join(", ");
    items.push({
      type: "concentration-risk",
      message: `High single-name concentration in ${names}`,
      sentiment: "caution",
    });
  }

  // 3. Review health — what fraction of holdings have fresh cases
  const caseMap = new Map<string, InvestmentCase>();
  for (const c of cases) {
    caseMap.set(c.ticker.toUpperCase(), c);
  }

  let reviewedCount = 0;
  let staleCount = 0;
  let noCaseCount = 0;
  for (const holding of portfolio.holdings) {
    const c = caseMap.get(holding.ticker.toUpperCase());
    if (!c) {
      noCaseCount++;
    } else if (daysSince(c.lastReviewedAt, now) >= 30) {
      staleCount++;
    } else {
      reviewedCount++;
    }
  }

  const total = portfolio.holdings.length;
  if (reviewedCount === total) {
    items.push({
      type: "review-health",
      message: "All holdings have recent case reviews",
      sentiment: "positive",
    });
  } else if (staleCount + noCaseCount > total / 2) {
    items.push({
      type: "review-health",
      message: `${String(staleCount + noCaseCount)} of ${String(total)} holdings lack recent reviews`,
      sentiment: "caution",
    });
  } else {
    items.push({
      type: "review-health",
      message: `${String(reviewedCount)} of ${String(total)} holdings have fresh case reviews`,
      sentiment: "neutral",
    });
  }

  // 4. Top sector exposure
  if (realSectors.length > 0) {
    const sorted = [...realSectors].sort((a, b) => b.weight - a.weight);
    const top = sorted[0];
    if (top && top.weight >= 40) {
      items.push({
        type: "exposure",
        message: `${top.sector} dominates at ${String(Math.round(top.weight))}% — consider if this aligns with your market outlook`,
        sentiment: "caution",
      });
    } else if (top && top.weight >= 20) {
      items.push({
        type: "exposure",
        message: `Largest sector exposure: ${top.sector} at ${String(Math.round(top.weight))}%`,
        sentiment: "neutral",
      });
    }
  }

  return items;
}

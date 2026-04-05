import assert from "node:assert/strict";
import test from "node:test";
import { buildRiskMarkers, buildMarketRegimeFit } from "./portfolio-utils";
import type { InvestmentCase, PortfolioOverview } from "@capyfin/contracts";

function makeCase(overrides: Partial<InvestmentCase> = {}): InvestmentCase {
  return {
    id: "c-1",
    ticker: "AAPL",
    companyName: "Apple Inc",
    stance: "BULLISH",
    confidence: "HIGH",
    lastReviewedAt: "2026-03-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
    sections: [],
    keyAssumptions: [],
    invalidationSignals: [],
    nextActions: [],
    history: [],
    tags: [],
    monitoringEnabled: false,
    staleDays: 30,
    ...overrides,
  } as InvestmentCase;
}

function makePortfolio(
  overrides: Partial<PortfolioOverview> = {},
): PortfolioOverview {
  return {
    holdings: [],
    totalValue: 0,
    sectorExposure: [],
    concentrationAlerts: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildRiskMarkers
// ---------------------------------------------------------------------------

void test("buildRiskMarkers returns empty array when portfolio is null", () => {
  const result = buildRiskMarkers(null, []);
  assert.equal(result.length, 0);
});

void test("buildRiskMarkers returns empty array when no holdings", () => {
  const portfolio = makePortfolio();
  const result = buildRiskMarkers(portfolio, []);
  assert.equal(result.length, 0);
});

void test("buildRiskMarkers flags high-weight position with no case", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "TSLA",
        shares: 50,
        costBasis: 200,
        weight: 25,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 10000,
  });
  const result = buildRiskMarkers(portfolio, []);
  assert.equal(result.length, 1);
  const first = result[0];
  assert.ok(first);
  assert.equal(first.ticker, "TSLA");
  assert.equal(first.severity, "high");
  assert.ok(first.reason.includes("no investment case"));
});

void test("buildRiskMarkers flags drift-detected as high severity", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 30,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
  });
  const cases = [makeCase({ attentionState: "drift-detected" })];
  const result = buildRiskMarkers(portfolio, cases);
  assert.equal(result.length, 1);
  const first = result[0];
  assert.ok(first);
  assert.equal(first.severity, "high");
  assert.ok(first.reason.includes("drift"));
});

void test("buildRiskMarkers flags review-now as high severity", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 30,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
  });
  const cases = [makeCase({ attentionState: "review-now" })];
  const result = buildRiskMarkers(portfolio, cases);
  assert.equal(result.length, 1);
  const first = result[0];
  assert.ok(first);
  assert.equal(first.severity, "high");
  assert.ok(first.reason.includes("immediate review"));
});

void test("buildRiskMarkers flags stale case with significant weight", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 20,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
  });
  const cases = [makeCase({ lastReviewedAt: "2026-02-01T00:00:00Z" })];
  const now = new Date("2026-04-05T00:00:00Z");
  const result = buildRiskMarkers(portfolio, cases, now);
  assert.equal(result.length, 1);
  const first = result[0];
  assert.ok(first);
  assert.ok(first.reason.includes("Not reviewed"));
  assert.equal(first.severity, "high");
});

void test("buildRiskMarkers flags low confidence case", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 15,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
  });
  const cases = [
    makeCase({
      confidence: "LOW",
      lastReviewedAt: "2026-03-30T00:00:00Z",
    }),
  ];
  const now = new Date("2026-04-05T00:00:00Z");
  const result = buildRiskMarkers(portfolio, cases, now);
  assert.equal(result.length, 1);
  const first = result[0];
  assert.ok(first);
  assert.ok(first.reason.includes("Low confidence"));
});

void test("buildRiskMarkers sorts by severity (high first)", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 15,
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "TSLA",
        shares: 50,
        costBasis: 200,
        weight: 25,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
  });
  const cases = [
    makeCase({
      confidence: "LOW",
      lastReviewedAt: "2026-03-30T00:00:00Z",
    }),
  ];
  const now = new Date("2026-04-05T00:00:00Z");
  const result = buildRiskMarkers(portfolio, cases, now);
  assert.ok(result.length >= 2);
  const first = result[0];
  assert.ok(first);
  assert.equal(first.severity, "high");
});

void test("buildRiskMarkers limits to 5 markers", () => {
  const holdings = Array.from({ length: 10 }, (_, i) => ({
    ticker: "T" + String(i),
    shares: 100,
    costBasis: 100,
    weight: 10,
    addedAt: "2026-01-01T00:00:00Z",
  }));
  const portfolio = makePortfolio({ holdings, totalValue: 100000 });
  const result = buildRiskMarkers(portfolio, []);
  assert.ok(result.length <= 5);
});

void test("buildRiskMarkers skips low-weight positions without case", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "TINY",
        shares: 1,
        costBasis: 10,
        weight: 2,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
  });
  const result = buildRiskMarkers(portfolio, []);
  assert.equal(result.length, 0);
});

// ---------------------------------------------------------------------------
// buildMarketRegimeFit
// ---------------------------------------------------------------------------

void test("buildMarketRegimeFit returns empty array when portfolio is null", () => {
  const result = buildMarketRegimeFit(null, []);
  assert.equal(result.length, 0);
});

void test("buildMarketRegimeFit returns empty array when no holdings", () => {
  const portfolio = makePortfolio();
  const result = buildMarketRegimeFit(portfolio, []);
  assert.equal(result.length, 0);
});

void test("buildMarketRegimeFit shows positive diversification for 4+ sectors", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 25,
        sector: "Technology",
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "JPM",
        shares: 50,
        costBasis: 100,
        weight: 25,
        sector: "Financials",
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "JNJ",
        shares: 30,
        costBasis: 80,
        weight: 25,
        sector: "Healthcare",
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "XOM",
        shares: 20,
        costBasis: 60,
        weight: 25,
        sector: "Energy",
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 100000,
    sectorExposure: [
      { sector: "Technology", weight: 25 },
      { sector: "Financials", weight: 25 },
      { sector: "Healthcare", weight: 25 },
      { sector: "Energy", weight: 25 },
    ],
  });
  const result = buildMarketRegimeFit(portfolio, []);
  const diversification = result.find((r) => r.type === "diversification");
  assert.ok(diversification);
  assert.equal(diversification.sentiment, "positive");
  assert.ok(diversification.message.includes("4 sectors"));
});

void test("buildMarketRegimeFit shows caution for lack of diversification", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 50,
        sector: "Technology",
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "MSFT",
        shares: 50,
        costBasis: 300,
        weight: 50,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
    sectorExposure: [{ sector: "Technology", weight: 50 }],
  });
  const result = buildMarketRegimeFit(portfolio, []);
  const diversification = result.find((r) => r.type === "diversification");
  assert.ok(diversification);
  assert.equal(diversification.sentiment, "caution");
});

void test("buildMarketRegimeFit flags concentration risk for >30% positions", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 40,
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "MSFT",
        shares: 50,
        costBasis: 300,
        weight: 60,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
    concentrationAlerts: [{ type: "position", name: "MSFT", weight: 60 }],
  });
  const result = buildMarketRegimeFit(portfolio, []);
  const concentration = result.find((r) => r.type === "concentration-risk");
  assert.ok(concentration);
  assert.equal(concentration.sentiment, "caution");
  assert.ok(concentration.message.includes("MSFT"));
});

void test("buildMarketRegimeFit shows positive review health when all reviewed", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 50,
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "MSFT",
        shares: 50,
        costBasis: 300,
        weight: 50,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
  });
  const cases = [
    makeCase({
      ticker: "AAPL",
      lastReviewedAt: "2026-03-30T00:00:00Z",
    }),
    makeCase({
      id: "c-2",
      ticker: "MSFT",
      companyName: "Microsoft",
      lastReviewedAt: "2026-03-30T00:00:00Z",
    }),
  ];
  const now = new Date("2026-04-05T00:00:00Z");
  const result = buildMarketRegimeFit(portfolio, cases, now);
  const health = result.find((r) => r.type === "review-health");
  assert.ok(health);
  assert.equal(health.sentiment, "positive");
});

void test("buildMarketRegimeFit shows caution when most holdings lack reviews", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 25,
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "MSFT",
        shares: 50,
        costBasis: 300,
        weight: 25,
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "GOOG",
        shares: 20,
        costBasis: 100,
        weight: 25,
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "TSLA",
        shares: 10,
        costBasis: 50,
        weight: 25,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
  });
  const now = new Date("2026-04-05T00:00:00Z");
  const result = buildMarketRegimeFit(portfolio, [], now);
  const health = result.find((r) => r.type === "review-health");
  assert.ok(health);
  assert.equal(health.sentiment, "caution");
});

void test("buildMarketRegimeFit shows exposure caution for dominant sector", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 50,
        sector: "Technology",
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
    sectorExposure: [{ sector: "Technology", weight: 50 }],
  });
  const result = buildMarketRegimeFit(portfolio, []);
  const exposure = result.find((r) => r.type === "exposure");
  assert.ok(exposure);
  assert.equal(exposure.sentiment, "caution");
  assert.ok(exposure.message.includes("Technology"));
});

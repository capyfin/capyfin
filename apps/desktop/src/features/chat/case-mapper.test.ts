import assert from "node:assert/strict";
import test from "node:test";
import { isDeepDiveOutput, mapCardOutputToCase } from "./case-mapper.ts";

const baseCardOutput = {
  cardId: "deep-dive",
  subject: "AAPL",
  companyName: "Apple Inc.",
  title: "Deep Dive: Apple Inc. (AAPL)",
  summary: "Apple is a high-quality business with a wide moat.",
  stance: "bullish" as const,
  confidence: "HIGH" as const,
  sections: [
    {
      id: "thesis",
      title: "Thesis",
      confidence: "HIGH" as const,
      content: "Apple has a wide moat driven by switching costs and brand.",
      citations: [
        { label: "10-K Filing", source: "SEC EDGAR", date: "2025-01-15" },
      ],
    },
    {
      id: "valuation",
      title: "Valuation",
      confidence: "MEDIUM" as const,
      content: "Revenue grew 8% YoY with stable margins.",
      citations: [
        { label: "Income Statement", source: "FMP API", date: "2025-03-01" },
      ],
    },
    {
      id: "risks",
      title: "Risks",
      confidence: "HIGH" as const,
      content: "Regulatory risk from antitrust actions.",
      citations: [],
    },
    {
      id: "catalysts",
      title: "Catalysts",
      confidence: "MEDIUM" as const,
      content: "WWDC 2025, iPhone 17 launch.",
      citations: [],
    },
    {
      id: "whatChanged",
      title: "What Changed",
      confidence: "HIGH" as const,
      content: "Initial case — no prior review.",
      citations: [],
    },
  ],
  keyAssumptions: [
    "Services revenue grows above 15% annually",
    "iPhone installed base continues expanding",
  ],
  invalidationSignals: [
    "Two consecutive quarters of iPhone revenue decline",
    "Services gross margin drops below 65%",
  ],
  scores: { Moat: "Wide", Confidence: "HIGH" },
  keyRisks: ["Antitrust regulation", "China revenue exposure"],
  challengeSummary: "Valuation is stretched at 30x forward P/E.",
  dataTier: "1" as const,
  sourcesUsed: ["SEC EDGAR", "FMP API"],
  dataAsOf: "2025-03-20",
  followUps: [
    "View Case",
    "Add to Watchlist",
    "Compare with Peer",
    "Review Valuation",
  ],
};

void test("isDeepDiveOutput returns true for deep-dive card with subject", () => {
  assert.equal(isDeepDiveOutput(baseCardOutput), true);
});

void test("isDeepDiveOutput returns false for non-deep-dive card", () => {
  assert.equal(
    isDeepDiveOutput({ ...baseCardOutput, cardId: "morning-brief" }),
    false,
  );
});

void test("isDeepDiveOutput returns false when subject is missing", () => {
  assert.equal(
    isDeepDiveOutput({
      ...baseCardOutput,
      subject: undefined,
    } as unknown as typeof baseCardOutput),
    false,
  );
});

void test("mapCardOutputToCase maps all fields from a full CardOutput", () => {
  const result = mapCardOutputToCase(baseCardOutput);
  assert.ok(result);
  assert.equal(result.ticker, "AAPL");
  assert.equal(result.companyName, "Apple Inc.");
  assert.equal(result.stance, "bullish");
  assert.equal(result.confidence, "HIGH");
  assert.equal(result.sections?.length, 5);
  assert.deepEqual(result.keyAssumptions, [
    "Services revenue grows above 15% annually",
    "iPhone installed base continues expanding",
  ]);
  assert.deepEqual(result.invalidationSignals, [
    "Two consecutive quarters of iPhone revenue decline",
    "Services gross margin drops below 65%",
  ]);
  assert.deepEqual(result.nextActions, [
    "View Case",
    "Add to Watchlist",
    "Compare with Peer",
    "Review Valuation",
  ]);
  assert.deepEqual(result.tags, ["deep-dive"]);
});

void test("mapCardOutputToCase falls back when optional case fields missing", () => {
  const minimal = {
    cardId: "deep-dive",
    subject: "MSFT",
    title: "Deep Dive: Microsoft",
    summary: "Microsoft analysis.",
    sections: [
      {
        id: "thesis",
        title: "Thesis",
        confidence: "MEDIUM" as const,
        content: "Cloud-first strategy.",
        citations: [],
      },
    ],
    keyRisks: ["Competitive pressure from AWS"],
    challengeSummary: "Enterprise spending slowdown.",
    dataTier: "0" as const,
    sourcesUsed: ["SEC EDGAR"],
    dataAsOf: "2025-03-20",
  };
  const result = mapCardOutputToCase(minimal);
  assert.ok(result);
  assert.equal(result.ticker, "MSFT");
  assert.equal(result.companyName, "MSFT"); // fallback to subject
  assert.equal(result.stance, "watching"); // default
  assert.equal(result.confidence, "MEDIUM"); // derived from sections
  assert.deepEqual(result.keyAssumptions, []);
  assert.deepEqual(result.invalidationSignals, [
    "Competitive pressure from AWS",
  ]); // falls back to keyRisks
  assert.deepEqual(result.nextActions, []);
  assert.deepEqual(result.tags, ["deep-dive"]);
});

void test("mapCardOutputToCase returns null for non-deep-dive card", () => {
  const result = mapCardOutputToCase({
    ...baseCardOutput,
    cardId: "fair-value",
  });
  assert.equal(result, null);
});

void test("mapCardOutputToCase returns null when subject is missing", () => {
  const result = mapCardOutputToCase({
    ...baseCardOutput,
    subject: undefined,
  } as unknown as typeof baseCardOutput);
  assert.equal(result, null);
});

void test("mapCardOutputToCase section structure matches CaseSection shape", () => {
  const result = mapCardOutputToCase(baseCardOutput);
  assert.ok(result);
  const thesisSection = result.sections?.find((s) => s.id === "thesis");
  assert.ok(thesisSection);
  assert.equal(thesisSection.title, "Thesis");
  assert.equal(thesisSection.confidence, "HIGH");
  assert.equal(
    thesisSection.content,
    "Apple has a wide moat driven by switching costs and brand.",
  );
  assert.equal(thesisSection.citations.length, 1);
  assert.equal(thesisSection.citations[0]?.label, "10-K Filing");
});

void test("mapCardOutputToCase derives confidence from sections when not set", () => {
  const withoutConfidence = {
    ...baseCardOutput,
    confidence: undefined,
    sections: [
      {
        id: "thesis",
        title: "Thesis",
        confidence: "LOW" as const,
        content: "...",
        citations: [],
      },
      {
        id: "valuation",
        title: "Valuation",
        confidence: "LOW" as const,
        content: "...",
        citations: [],
      },
      {
        id: "risks",
        title: "Risks",
        confidence: "MEDIUM" as const,
        content: "...",
        citations: [],
      },
    ],
  };
  const result = mapCardOutputToCase(withoutConfidence);
  assert.ok(result);
  assert.equal(result.confidence, "LOW");
});

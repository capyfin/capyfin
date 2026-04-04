import assert from "node:assert/strict";
import test from "node:test";
import { formatCaseForPrompt } from "./case-context.ts";

const sampleCase = {
  id: "case-001",
  ticker: "AAPL",
  companyName: "Apple Inc.",
  stance: "bullish" as const,
  confidence: "HIGH" as const,
  lastReviewedAt: "2025-09-15T10:00:00Z",
  createdAt: "2025-06-01T10:00:00Z",
  updatedAt: "2025-09-15T10:00:00Z",
  sections: [
    {
      id: "thesis",
      title: "Thesis",
      confidence: "HIGH" as const,
      content: "Apple has a wide moat driven by switching costs and brand.",
      citations: [],
    },
    {
      id: "valuation",
      title: "Valuation",
      confidence: "MEDIUM" as const,
      content: "Trading at 28x forward P/E, near historical average.",
      citations: [],
    },
  ],
  keyAssumptions: [
    "Services revenue grows above 15% annually",
    "iPhone installed base continues expanding",
  ],
  invalidationSignals: ["Two consecutive quarters of iPhone revenue decline"],
  nextActions: ["Review after Q4 earnings", "Compare with MSFT"],
  history: [],
  tags: ["deep-dive"],
};

void test("formatCaseForPrompt includes the header and basic fields", () => {
  const result = formatCaseForPrompt(sampleCase);
  assert.ok(result.includes("## Prior Case State"));
  assert.ok(result.includes("**Ticker:** AAPL"));
  assert.ok(result.includes("**Company:** Apple Inc."));
  assert.ok(result.includes("**Stance:** bullish"));
  assert.ok(result.includes("**Confidence:** HIGH"));
  assert.ok(result.includes("**Last Reviewed:** 2025-09-15"));
  assert.ok(result.includes("**Case Created:** 2025-06-01"));
});

void test("formatCaseForPrompt includes key assumptions numbered", () => {
  const result = formatCaseForPrompt(sampleCase);
  assert.ok(result.includes("### Key Assumptions"));
  assert.ok(result.includes("1. Services revenue grows above 15% annually"));
  assert.ok(result.includes("2. iPhone installed base continues expanding"));
});

void test("formatCaseForPrompt includes invalidation signals", () => {
  const result = formatCaseForPrompt(sampleCase);
  assert.ok(result.includes("### Invalidation Signals"));
  assert.ok(
    result.includes("- Two consecutive quarters of iPhone revenue decline"),
  );
});

void test("formatCaseForPrompt includes section summaries", () => {
  const result = formatCaseForPrompt(sampleCase);
  assert.ok(result.includes("### Thesis"));
  assert.ok(
    result.includes(
      "Apple has a wide moat driven by switching costs and brand.",
    ),
  );
  assert.ok(result.includes("### Valuation"));
  assert.ok(
    result.includes("Trading at 28x forward P/E, near historical average."),
  );
});

void test("formatCaseForPrompt includes prior next actions", () => {
  const result = formatCaseForPrompt(sampleCase);
  assert.ok(result.includes("### Prior Next Actions"));
  assert.ok(result.includes("- Review after Q4 earnings"));
  assert.ok(result.includes("- Compare with MSFT"));
});

void test("formatCaseForPrompt truncates very long section content", () => {
  const longCase = {
    ...sampleCase,
    sections: [
      {
        id: "thesis",
        title: "Thesis",
        confidence: "HIGH" as const,
        content: "A".repeat(3000),
        citations: [],
      },
    ],
  };
  const result = formatCaseForPrompt(longCase);
  assert.ok(result.includes("[...truncated]"));
  // Should contain at most 2000 chars of the content before truncation
  assert.ok(!result.includes("A".repeat(2001)));
});

void test("formatCaseForPrompt handles empty assumptions gracefully", () => {
  const emptyCase = {
    ...sampleCase,
    keyAssumptions: [],
    invalidationSignals: [],
    nextActions: [],
  };
  const result = formatCaseForPrompt(emptyCase);
  assert.ok(!result.includes("### Key Assumptions"));
  assert.ok(!result.includes("### Invalidation Signals"));
  assert.ok(!result.includes("### Prior Next Actions"));
});

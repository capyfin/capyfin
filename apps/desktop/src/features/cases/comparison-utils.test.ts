import assert from "node:assert/strict";
import test from "node:test";
import type {
  InvestmentCase,
  CaseSection,
  CaseHistoryEntry,
} from "@capyfin/contracts";
import {
  alignSections,
  computeDifferences,
  classifyChange,
  computePriorComparison,
  type AlignedSection,
} from "./comparison-utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSection(overrides: Partial<CaseSection> = {}): CaseSection {
  return {
    id: "thesis",
    title: "Thesis",
    content: "Some content",
    confidence: "HIGH",
    citations: [],
    ...overrides,
  };
}

function makeCase(overrides: Partial<InvestmentCase> = {}): InvestmentCase {
  return {
    id: "case-1",
    ticker: "AAPL",
    companyName: "Apple Inc.",
    stance: "bullish",
    confidence: "HIGH",
    lastReviewedAt: "2026-04-01T00:00:00Z",
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
    sections: [
      makeSection({ id: "thesis", title: "Thesis" }),
      makeSection({ id: "valuation", title: "Valuation" }),
      makeSection({ id: "risks", title: "Risks" }),
      makeSection({ id: "catalysts", title: "Catalysts" }),
    ],
    keyAssumptions: ["Strong iPhone sales", "Services growth continues"],
    invalidationSignals: ["China ban on Apple products"],
    nextActions: ["Review after Q2 earnings"],
    history: [],
    tags: ["tech"],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// classifyChange
// ---------------------------------------------------------------------------

void test("classifyChange returns 'same' when values are equal", () => {
  assert.equal(classifyChange("stance", "bullish", "bullish"), "same");
  assert.equal(classifyChange("confidence", "HIGH", "HIGH"), "same");
});

void test("classifyChange returns 'improved' for stance upgrades", () => {
  assert.equal(classifyChange("stance", "bearish", "neutral"), "improved");
  assert.equal(classifyChange("stance", "neutral", "bullish"), "improved");
  assert.equal(classifyChange("stance", "watching", "bullish"), "improved");
});

void test("classifyChange returns 'degraded' for stance downgrades", () => {
  assert.equal(classifyChange("stance", "bullish", "neutral"), "degraded");
  assert.equal(classifyChange("stance", "neutral", "bearish"), "degraded");
  assert.equal(classifyChange("stance", "bullish", "bearish"), "degraded");
});

void test("classifyChange returns 'improved' for confidence upgrades", () => {
  assert.equal(classifyChange("confidence", "LOW", "MEDIUM"), "improved");
  assert.equal(classifyChange("confidence", "MEDIUM", "HIGH"), "improved");
  assert.equal(classifyChange("confidence", "LOW", "HIGH"), "improved");
});

void test("classifyChange returns 'degraded' for confidence downgrades", () => {
  assert.equal(classifyChange("confidence", "HIGH", "MEDIUM"), "degraded");
  assert.equal(classifyChange("confidence", "MEDIUM", "LOW"), "degraded");
  assert.equal(classifyChange("confidence", "HIGH", "LOW"), "degraded");
});

void test("classifyChange returns 'new' when left is undefined", () => {
  assert.equal(classifyChange("stance", undefined, "bullish"), "new");
});

void test("classifyChange returns 'removed' when right is undefined", () => {
  assert.equal(classifyChange("stance", "bullish", undefined), "removed");
});

// ---------------------------------------------------------------------------
// alignSections
// ---------------------------------------------------------------------------

void test("alignSections matches sections by id", () => {
  const left = makeCase({
    sections: [
      makeSection({ id: "thesis", title: "Thesis", content: "Left thesis" }),
      makeSection({
        id: "valuation",
        title: "Valuation",
        content: "Left val",
      }),
    ],
  });
  const right = makeCase({
    sections: [
      makeSection({ id: "thesis", title: "Thesis", content: "Right thesis" }),
      makeSection({
        id: "valuation",
        title: "Valuation",
        content: "Right val",
      }),
    ],
  });

  const aligned = alignSections(left, right);
  assert.equal(aligned.length, 2);
  const first = aligned[0];
  assert.ok(first);
  assert.equal(first.sectionId, "thesis");
  assert.equal(first.left?.content, "Left thesis");
  assert.equal(first.right?.content, "Right thesis");
});

void test("alignSections handles missing sections on one side", () => {
  const left = makeCase({
    sections: [
      makeSection({ id: "thesis", title: "Thesis" }),
      makeSection({ id: "risks", title: "Risks" }),
    ],
  });
  const right = makeCase({
    sections: [
      makeSection({ id: "thesis", title: "Thesis" }),
      makeSection({ id: "catalysts", title: "Catalysts" }),
    ],
  });

  const aligned = alignSections(left, right);
  assert.equal(aligned.length, 3); // thesis, risks (left only), catalysts (right only)

  const thesisRow = aligned.find(
    (a: AlignedSection) => a.sectionId === "thesis",
  );
  assert.ok(thesisRow);
  assert.ok(thesisRow.left);
  assert.ok(thesisRow.right);

  const risksRow = aligned.find((a: AlignedSection) => a.sectionId === "risks");
  assert.ok(risksRow);
  assert.ok(risksRow.left);
  assert.equal(risksRow.right, null);

  const catalystsRow = aligned.find(
    (a: AlignedSection) => a.sectionId === "catalysts",
  );
  assert.ok(catalystsRow);
  assert.equal(catalystsRow.left, null);
  assert.ok(catalystsRow.right);
});

void test("alignSections returns empty array for cases with no sections", () => {
  const left = makeCase({ sections: [] });
  const right = makeCase({ sections: [] });
  const aligned = alignSections(left, right);
  assert.equal(aligned.length, 0);
});

// ---------------------------------------------------------------------------
// computeDifferences
// ---------------------------------------------------------------------------

void test("computeDifferences identifies same stance and confidence", () => {
  const left = makeCase({ stance: "bullish", confidence: "HIGH" });
  const right = makeCase({ stance: "bullish", confidence: "HIGH" });
  const result = computeDifferences(left, right);
  assert.equal(result.stanceChange, "same");
  assert.equal(result.confidenceChange, "same");
});

void test("computeDifferences detects stance and confidence changes", () => {
  const left = makeCase({ stance: "bullish", confidence: "HIGH" });
  const right = makeCase({ stance: "bearish", confidence: "LOW" });
  const result = computeDifferences(left, right);
  assert.equal(result.stanceChange, "degraded");
  assert.equal(result.confidenceChange, "degraded");
  assert.equal(result.leftStance, "bullish");
  assert.equal(result.rightStance, "bearish");
});

void test("computeDifferences finds unique assumptions", () => {
  const left = makeCase({
    keyAssumptions: ["Strong iPhone sales", "Services growth"],
  });
  const right = makeCase({
    keyAssumptions: ["Strong iPhone sales", "AI revolution"],
  });
  const result = computeDifferences(left, right);
  assert.deepEqual(result.leftOnlyAssumptions, ["Services growth"]);
  assert.deepEqual(result.rightOnlyAssumptions, ["AI revolution"]);
  assert.deepEqual(result.sharedAssumptions, ["Strong iPhone sales"]);
});

void test("computeDifferences finds unique risks", () => {
  const left = makeCase({
    invalidationSignals: ["China ban", "Recession"],
  });
  const right = makeCase({
    invalidationSignals: ["China ban", "Regulatory crackdown"],
  });
  const result = computeDifferences(left, right);
  assert.deepEqual(result.leftOnlyRisks, ["Recession"]);
  assert.deepEqual(result.rightOnlyRisks, ["Regulatory crackdown"]);
  assert.deepEqual(result.sharedRisks, ["China ban"]);
});

void test("computeDifferences includes aligned sections", () => {
  const left = makeCase();
  const right = makeCase();
  const result = computeDifferences(left, right);
  assert.ok(result.alignedSections.length > 0);
});

// ---------------------------------------------------------------------------
// computePriorComparison
// ---------------------------------------------------------------------------

void test("computePriorComparison returns null when no history", () => {
  const currentCase = makeCase({ history: [] });
  const result = computePriorComparison(currentCase);
  assert.equal(result, null);
});

void test("computePriorComparison builds comparison from latest history entry", () => {
  const historyEntry: CaseHistoryEntry = {
    id: "h1",
    date: "2026-03-15T00:00:00Z",
    eventType: "refreshed",
    summary: "Updated after Q1 earnings beat",
    priorStance: "neutral",
    newStance: "bullish",
    priorConfidence: "MEDIUM",
    newConfidence: "HIGH",
  };

  const currentCase = makeCase({
    stance: "bullish",
    confidence: "HIGH",
    history: [historyEntry],
  });

  const result = computePriorComparison(currentCase);
  assert.ok(result);
  assert.equal(result.priorStance, "neutral");
  assert.equal(result.currentStance, "bullish");
  assert.equal(result.priorConfidence, "MEDIUM");
  assert.equal(result.currentConfidence, "HIGH");
  assert.equal(result.stanceChange, "improved");
  assert.equal(result.confidenceChange, "improved");
  assert.equal(result.historySummary, "Updated after Q1 earnings beat");
});

void test("computePriorComparison uses the most recent history entry", () => {
  const olderEntry: CaseHistoryEntry = {
    id: "h1",
    date: "2026-02-15T00:00:00Z",
    eventType: "created",
    summary: "Initial case created",
    priorStance: undefined,
    newStance: "watching",
    priorConfidence: undefined,
    newConfidence: "LOW",
  };

  const newerEntry: CaseHistoryEntry = {
    id: "h2",
    date: "2026-03-15T00:00:00Z",
    eventType: "refreshed",
    summary: "Upgraded after strong results",
    priorStance: "watching",
    newStance: "bullish",
    priorConfidence: "LOW",
    newConfidence: "HIGH",
  };

  const currentCase = makeCase({
    stance: "bullish",
    confidence: "HIGH",
    history: [olderEntry, newerEntry],
  });

  const result = computePriorComparison(currentCase);
  assert.ok(result);
  assert.equal(result.historySummary, "Upgraded after strong results");
  assert.equal(result.priorStance, "watching");
});

void test("computePriorComparison handles history entry without prior values", () => {
  const historyEntry: CaseHistoryEntry = {
    id: "h1",
    date: "2026-03-15T00:00:00Z",
    eventType: "created",
    summary: "Initial case",
  };

  const currentCase = makeCase({
    stance: "bullish",
    confidence: "HIGH",
    history: [historyEntry],
  });

  const result = computePriorComparison(currentCase);
  assert.ok(result);
  assert.equal(result.priorStance, undefined);
  assert.equal(result.currentStance, "bullish");
  assert.equal(result.historySummary, "Initial case");
});

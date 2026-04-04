import assert from "node:assert/strict";
import test from "node:test";
import { CASES_EMPTY_TEXT, CASE_DETAIL_TABS } from "./constants";
import {
  alignSections,
  computeDifferences,
  classifyChange,
  computePriorComparison,
} from "./comparison-utils";

// ---------------------------------------------------------------------------
// CasesWorkspace
// ---------------------------------------------------------------------------

void test("CasesWorkspace exports a function component", async () => {
  const mod = await import("./components/CasesWorkspace");
  assert.equal(typeof mod.CasesWorkspace, "function");
});

void test("CasesWorkspace exports CasesSortBy type values", async () => {
  // CasesSortBy is a type, but we can verify the component exists
  const mod = await import("./components/CasesWorkspace");
  assert.ok(mod.CasesWorkspace);
});

// ---------------------------------------------------------------------------
// CasesEmptyState
// ---------------------------------------------------------------------------

void test("CASES_EMPTY_TEXT is a non-empty string", () => {
  assert.ok(typeof CASES_EMPTY_TEXT === "string");
  assert.ok(CASES_EMPTY_TEXT.length > 0);
});

void test("CasesEmptyState exports a function component", async () => {
  const mod = await import("./components/CasesEmptyState");
  assert.equal(typeof mod.CasesEmptyState, "function");
});

// ---------------------------------------------------------------------------
// CaseCard
// ---------------------------------------------------------------------------

void test("CaseCard exports a function component", async () => {
  const mod = await import("./components/CaseCard");
  assert.equal(typeof mod.CaseCard, "function");
});

// ---------------------------------------------------------------------------
// CaseDetailPage
// ---------------------------------------------------------------------------

void test("CaseDetailPage exports a function component", async () => {
  const mod = await import("./components/CaseDetailPage");
  assert.equal(typeof mod.CaseDetailPage, "function");
});

void test("CASE_DETAIL_TABS has exactly 7 tabs", () => {
  assert.equal(CASE_DETAIL_TABS.length, 7);
});

void test("CASE_DETAIL_TABS contains the correct tab IDs", () => {
  const ids = CASE_DETAIL_TABS.map((t) => t.id);
  assert.deepEqual(ids, [
    "overview",
    "thesis",
    "valuation",
    "risks",
    "whatChanged",
    "catalysts",
    "history",
  ]);
});

void test("CASE_DETAIL_TABS each has a non-empty label", () => {
  for (const tab of CASE_DETAIL_TABS) {
    assert.ok(tab.label.length > 0, `Tab ${tab.id} should have a label`);
  }
});

// ---------------------------------------------------------------------------
// StanceBadge
// ---------------------------------------------------------------------------

void test("StanceBadge exports a function component", async () => {
  const mod = await import("./components/StanceBadge");
  assert.equal(typeof mod.StanceBadge, "function");
});

// ---------------------------------------------------------------------------
// Tab components
// ---------------------------------------------------------------------------

void test("OverviewTab exports a function component", async () => {
  const mod = await import("./components/OverviewTab");
  assert.equal(typeof mod.OverviewTab, "function");
});

void test("SectionTab exports a function component", async () => {
  const mod = await import("./components/SectionTab");
  assert.equal(typeof mod.SectionTab, "function");
});

void test("HistoryTab exports a function component", async () => {
  const mod = await import("./components/HistoryTab");
  assert.equal(typeof mod.HistoryTab, "function");
});

// ---------------------------------------------------------------------------
// Comparison components
// ---------------------------------------------------------------------------

void test("ComparisonWorkspace exports a function component", async () => {
  const mod = await import("./components/ComparisonWorkspace");
  assert.equal(typeof mod.ComparisonWorkspace, "function");
});

void test("CaseSelector exports a function component", async () => {
  const mod = await import("./components/CaseSelector");
  assert.equal(typeof mod.CaseSelector, "function");
});

void test("DifferencesSummary exports a function component", async () => {
  const mod = await import("./components/DifferencesSummary");
  assert.equal(typeof mod.DifferencesSummary, "function");
});

void test("ComparisonGrid exports a function component", async () => {
  const mod = await import("./components/ComparisonGrid");
  assert.equal(typeof mod.ComparisonGrid, "function");
});

void test("ComparisonSectionRow exports a function component", async () => {
  const mod = await import("./components/ComparisonSectionRow");
  assert.equal(typeof mod.ComparisonSectionRow, "function");
});

void test("ChangeBadge exports a function component", async () => {
  const mod = await import("./components/ChangeBadge");
  assert.equal(typeof mod.ChangeBadge, "function");
});

void test("PriorComparisonView exports a function component", async () => {
  const mod = await import("./components/PriorComparisonView");
  assert.equal(typeof mod.PriorComparisonView, "function");
});

// ---------------------------------------------------------------------------
// Comparison utilities (integrated tests)
// ---------------------------------------------------------------------------

void test("comparison-utils exports all required functions", () => {
  assert.equal(typeof alignSections, "function");
  assert.equal(typeof computeDifferences, "function");
  assert.equal(typeof classifyChange, "function");
  assert.equal(typeof computePriorComparison, "function");
});

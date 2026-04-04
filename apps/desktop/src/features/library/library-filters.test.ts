import assert from "node:assert/strict";
import test from "node:test";
import type { SavedReport } from "@capyfin/contracts";

void test("LibraryFilters exports INITIAL_FILTER_STATE with all filter fields", async () => {
  const mod = await import("./components/LibraryFilters");
  const state = mod.INITIAL_FILTER_STATE;
  assert.equal(state.search, "");
  assert.equal(state.workflowType, "");
  assert.equal(state.view, "all");
  assert.equal(state.company, "");
  assert.equal(state.dateSort, "newest");
  assert.equal(state.holdingStatus, "all");
});

void test("LibraryFilterState includes company field", async () => {
  const mod = await import("./components/LibraryFilters");
  const state: typeof mod.INITIAL_FILTER_STATE = {
    ...mod.INITIAL_FILTER_STATE,
    company: "AAPL",
  };
  assert.equal(state.company, "AAPL");
});

void test("LibraryFilterState includes dateSort field with valid values", async () => {
  const { INITIAL_FILTER_STATE } = await import("./components/LibraryFilters");
  const newest: typeof INITIAL_FILTER_STATE = {
    ...INITIAL_FILTER_STATE,
    dateSort: "newest",
  };
  const oldest: typeof INITIAL_FILTER_STATE = {
    ...INITIAL_FILTER_STATE,
    dateSort: "oldest",
  };
  assert.equal(newest.dateSort, "newest");
  assert.equal(oldest.dateSort, "oldest");
});

void test("LibraryFilterState includes holdingStatus field with valid values", async () => {
  const { INITIAL_FILTER_STATE } = await import("./components/LibraryFilters");
  const all: typeof INITIAL_FILTER_STATE = {
    ...INITIAL_FILTER_STATE,
    holdingStatus: "all",
  };
  const holdings: typeof INITIAL_FILTER_STATE = {
    ...INITIAL_FILTER_STATE,
    holdingStatus: "holdings",
  };
  const watching: typeof INITIAL_FILTER_STATE = {
    ...INITIAL_FILTER_STATE,
    holdingStatus: "watching",
  };
  assert.equal(all.holdingStatus, "all");
  assert.equal(holdings.holdingStatus, "holdings");
  assert.equal(watching.holdingStatus, "watching");
});

void test("LibraryFilters exports a function component", async () => {
  const mod = await import("./components/LibraryFilters");
  assert.equal(typeof mod.LibraryFilters, "function");
});

void test("applyLibraryFilters filters by company", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({ subject: "AAPL" }),
    makeReport({ subject: "TSLA" }),
    makeReport({ subject: "AAPL" }),
  ];
  const filters = { ...INITIAL_FILTER_STATE, company: "AAPL" };
  const result = applyLibraryFilters(reports, filters, new Set());
  assert.equal(result.length, 2);
  assert.ok(result.every((r) => r.subject === "AAPL"));
});

void test("applyLibraryFilters filters by workflowType", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({ workflowType: "deep-dive" }),
    makeReport({ workflowType: "position-review" }),
    makeReport({ workflowType: "deep-dive" }),
  ];
  const filters = { ...INITIAL_FILTER_STATE, workflowType: "deep-dive" };
  const result = applyLibraryFilters(reports, filters, new Set());
  assert.equal(result.length, 2);
});

void test("applyLibraryFilters filters by search text", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({
      cardOutput: {
        title: "Apple Deep Dive",
        summary: "Analysis of Apple",
        sections: [],
      },
      subject: "AAPL",
    }),
    makeReport({
      cardOutput: {
        title: "Tesla Review",
        summary: "Review of Tesla",
        sections: [],
      },
      subject: "TSLA",
    }),
  ];
  const filters = { ...INITIAL_FILTER_STATE, search: "apple" };
  const result = applyLibraryFilters(reports, filters, new Set());
  assert.equal(result.length, 1);
  assert.equal(at(result, 0).subject, "AAPL");
});

void test("applyLibraryFilters filters by pinned view", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({ pinnedAt: "2024-01-01T00:00:00Z" }),
    makeReport({ pinnedAt: null }),
  ];
  const filters = { ...INITIAL_FILTER_STATE, view: "pinned" as const };
  const result = applyLibraryFilters(reports, filters, new Set());
  assert.equal(result.length, 1);
  assert.ok(at(result, 0).pinnedAt !== null);
});

void test("applyLibraryFilters filters by starred view", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({ starred: true }),
    makeReport({ starred: false }),
  ];
  const filters = { ...INITIAL_FILTER_STATE, view: "starred" as const };
  const result = applyLibraryFilters(reports, filters, new Set());
  assert.equal(result.length, 1);
  assert.ok(at(result, 0).starred);
});

void test("applyLibraryFilters filters by archived view", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({ pinnedAt: "2024-01-01T00:00:00Z", starred: true }),
    makeReport({ pinnedAt: null, starred: false }),
    makeReport({ pinnedAt: "2024-01-01T00:00:00Z", starred: false }),
  ];
  const filters = { ...INITIAL_FILTER_STATE, view: "archived" as const };
  const result = applyLibraryFilters(reports, filters, new Set());
  assert.equal(result.length, 1);
  const first = at(result, 0);
  assert.ok(first.pinnedAt === null && !first.starred);
});

void test("applyLibraryFilters sorts by newest first by default", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({ savedAt: "2024-01-01T00:00:00Z" }),
    makeReport({ savedAt: "2024-06-01T00:00:00Z" }),
    makeReport({ savedAt: "2024-03-01T00:00:00Z" }),
  ];
  const result = applyLibraryFilters(reports, INITIAL_FILTER_STATE, new Set());
  assert.equal(at(result, 0).savedAt, "2024-06-01T00:00:00Z");
  assert.equal(at(result, 1).savedAt, "2024-03-01T00:00:00Z");
  assert.equal(at(result, 2).savedAt, "2024-01-01T00:00:00Z");
});

void test("applyLibraryFilters sorts by oldest first", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({ savedAt: "2024-06-01T00:00:00Z" }),
    makeReport({ savedAt: "2024-01-01T00:00:00Z" }),
    makeReport({ savedAt: "2024-03-01T00:00:00Z" }),
  ];
  const filters = { ...INITIAL_FILTER_STATE, dateSort: "oldest" as const };
  const result = applyLibraryFilters(reports, filters, new Set());
  assert.equal(at(result, 0).savedAt, "2024-01-01T00:00:00Z");
  assert.equal(at(result, 1).savedAt, "2024-03-01T00:00:00Z");
  assert.equal(at(result, 2).savedAt, "2024-06-01T00:00:00Z");
});

void test("applyLibraryFilters filters by holdings status", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({ subject: "AAPL" }),
    makeReport({ subject: "TSLA" }),
    makeReport({ subject: "GOOG" }),
  ];
  const holdingTickers = new Set(["AAPL", "GOOG"]);
  const filters = {
    ...INITIAL_FILTER_STATE,
    holdingStatus: "holdings" as const,
  };
  const result = applyLibraryFilters(reports, filters, holdingTickers);
  assert.equal(result.length, 2);
  assert.ok(result.some((r) => r.subject === "AAPL"));
  assert.ok(result.some((r) => r.subject === "GOOG"));
});

void test("applyLibraryFilters filters by watching status", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({ subject: "AAPL" }),
    makeReport({ subject: "TSLA" }),
    makeReport({ subject: "GOOG" }),
  ];
  const holdingTickers = new Set(["AAPL"]);
  const filters = {
    ...INITIAL_FILTER_STATE,
    holdingStatus: "watching" as const,
  };
  const result = applyLibraryFilters(reports, filters, holdingTickers);
  assert.equal(result.length, 2);
  assert.ok(result.some((r) => r.subject === "TSLA"));
  assert.ok(result.some((r) => r.subject === "GOOG"));
});

void test("applyLibraryFilters combines multiple filters", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({
      subject: "AAPL",
      workflowType: "deep-dive",
      pinnedAt: "2024-01-01T00:00:00Z",
    }),
    makeReport({
      subject: "AAPL",
      workflowType: "position-review",
      pinnedAt: null,
    }),
    makeReport({
      subject: "TSLA",
      workflowType: "deep-dive",
      pinnedAt: "2024-01-01T00:00:00Z",
    }),
  ];
  const filters = {
    ...INITIAL_FILTER_STATE,
    company: "AAPL",
    workflowType: "deep-dive",
    view: "pinned" as const,
  };
  const result = applyLibraryFilters(reports, filters, new Set());
  assert.equal(result.length, 1);
  assert.equal(at(result, 0).subject, "AAPL");
  assert.equal(at(result, 0).workflowType, "deep-dive");
});

void test("applyLibraryFilters pinned-first sort preserves within newest", async () => {
  const { applyLibraryFilters, INITIAL_FILTER_STATE } =
    await import("./components/LibraryFilters");
  const reports = [
    makeReport({
      savedAt: "2024-01-01T00:00:00Z",
      pinnedAt: "2024-01-01T00:00:00Z",
    }),
    makeReport({ savedAt: "2024-06-01T00:00:00Z", pinnedAt: null }),
    makeReport({
      savedAt: "2024-03-01T00:00:00Z",
      pinnedAt: "2024-03-01T00:00:00Z",
    }),
  ];
  const result = applyLibraryFilters(reports, INITIAL_FILTER_STATE, new Set());
  // Pinned reports first
  assert.ok(at(result, 0).pinnedAt !== null);
  assert.ok(at(result, 1).pinnedAt !== null);
  assert.ok(at(result, 2).pinnedAt === null);
});

/** Safe array access that throws if index is out of bounds */
function at<T>(arr: T[], index: number): T {
  if (index >= arr.length)
    throw new Error(`Index ${String(index)} out of bounds`);
  return arr[index] as T;
}

// Helper to create test reports
let reportId = 0;
function makeReport(
  overrides: Partial<{
    id: string;
    cardOutput: { title: string; summary: string; sections: unknown[] };
    workflowType: string;
    subject: string;
    savedAt: string;
    pinnedAt: string | null;
    starred: boolean;
    tags: string[];
  }> = {},
): SavedReport {
  reportId++;
  return {
    id: overrides.id ?? `report-${String(reportId)}`,
    cardOutput: overrides.cardOutput ?? {
      title: "Test Report",
      summary: "Test summary",
      sections: [],
    },
    workflowType: overrides.workflowType ?? "deep-dive",
    subject: overrides.subject ?? "TEST",
    savedAt: overrides.savedAt ?? "2024-01-01T00:00:00Z",
    pinnedAt: overrides.pinnedAt ?? null,
    starred: overrides.starred ?? false,
    tags: overrides.tags ?? [],
  } as SavedReport;
}

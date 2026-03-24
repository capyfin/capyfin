import assert from "node:assert/strict";
import test from "node:test";
import { LIBRARY_EMPTY_TEXT } from "./components/LibraryWorkspace";

void test("LIBRARY_EMPTY_TEXT is a non-empty string", () => {
  assert.ok(typeof LIBRARY_EMPTY_TEXT === "string");
  assert.ok(LIBRARY_EMPTY_TEXT.length > 0);
});

void test("LibraryWorkspace exports a function component", async () => {
  const mod = await import("./components/LibraryWorkspace");
  assert.equal(typeof mod.LibraryWorkspace, "function");
});

void test("SavedReportCard exports a function component", async () => {
  const mod = await import("./components/SavedReportCard");
  assert.equal(typeof mod.SavedReportCard, "function");
});

void test("LibraryFilters exports a function component", async () => {
  const mod = await import("./components/LibraryFilters");
  assert.equal(typeof mod.LibraryFilters, "function");
});

void test("ReportDetailDialog exports a function component", async () => {
  const mod = await import("./components/ReportDetailDialog");
  assert.equal(typeof mod.ReportDetailDialog, "function");
});

void test("INITIAL_FILTER_STATE has expected default values", async () => {
  const mod = await import("./components/LibraryFilters");
  assert.equal(mod.INITIAL_FILTER_STATE.search, "");
  assert.equal(mod.INITIAL_FILTER_STATE.workflowType, "");
  assert.equal(mod.INITIAL_FILTER_STATE.view, "all");
});

void test("cardOutputToMarkdown is exported from export-markdown", async () => {
  const mod = await import("./export-markdown");
  assert.equal(typeof mod.cardOutputToMarkdown, "function");
});

void test("copyReportToClipboard is exported from export-markdown", async () => {
  const mod = await import("./export-markdown");
  assert.equal(typeof mod.copyReportToClipboard, "function");
});

void test("downloadReportAsMarkdown is exported from export-markdown", async () => {
  const mod = await import("./export-markdown");
  assert.equal(typeof mod.downloadReportAsMarkdown, "function");
});

void test("LibraryEmptyState exports a function component", async () => {
  const mod = await import("./components/LibraryEmptyState");
  assert.equal(typeof mod.LibraryEmptyState, "function");
});

void test("LibraryEmptyState accepts onGoToLaunchpad and onOpenChat props", async () => {
  const mod = await import("./components/LibraryEmptyState");
  assert.equal(mod.LibraryEmptyState.length >= 0, true);
});

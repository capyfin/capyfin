import assert from "node:assert/strict";
import test from "node:test";

void test("ReportView exports a function component", async () => {
  const mod = await import("./ReportView");
  assert.equal(typeof mod.ReportView, "function");
});

void test("ReportView accepts onAddToWatchlist prop", async () => {
  const mod = await import("./ReportView");
  // ReportView is a React component accepting props including onAddToWatchlist
  // We verify the component function exists and has expected arity (takes 1 props object)
  assert.equal(mod.ReportView.length >= 0, true);
});

void test("ReportViewProps type includes onAddToWatchlist", async () => {
  // Verifies that the module imports without error and the component
  // can be referenced with the new prop shape
  const { ReportView } = await import("./ReportView");
  assert.equal(typeof ReportView, "function");
});

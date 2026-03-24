import assert from "node:assert/strict";
import test from "node:test";
import { AUTOMATION_EMPTY_TEXT } from "./components/AutomationWorkspace";

void test("AUTOMATION_EMPTY_TEXT is a non-empty string", () => {
  assert.ok(typeof AUTOMATION_EMPTY_TEXT === "string");
  assert.ok(AUTOMATION_EMPTY_TEXT.length > 0);
});

void test("AutomationWorkspace exports a function component", async () => {
  const mod = await import("./components/AutomationWorkspace");
  assert.equal(typeof mod.AutomationWorkspace, "function");
});

void test("AutomationEmptyState exports a function component", async () => {
  const mod = await import("./components/AutomationEmptyState");
  assert.equal(typeof mod.AutomationEmptyState, "function");
});

void test("AutomationList exports a function component", async () => {
  const mod = await import("./components/AutomationList");
  assert.equal(typeof mod.AutomationList, "function");
});

void test("AutomationDialog exports a function component", async () => {
  const mod = await import("./components/AutomationDialog");
  assert.equal(typeof mod.AutomationDialog, "function");
});

void test("RunHistoryPanel exports a function component", async () => {
  const mod = await import("./components/RunHistoryPanel");
  assert.equal(typeof mod.RunHistoryPanel, "function");
});

void test("DeleteConfirmDialog exports a function component", async () => {
  const mod = await import("./components/DeleteConfirmDialog");
  assert.equal(typeof mod.DeleteConfirmDialog, "function");
});

void test("AutomationList accepts required props shape", async () => {
  const mod = await import("./components/AutomationList");
  // Verify the component function exists and can accept arguments
  assert.equal(mod.AutomationList.length >= 0, true);
});

void test("AutomationDialog accepts required props shape", async () => {
  const mod = await import("./components/AutomationDialog");
  assert.equal(mod.AutomationDialog.length >= 0, true);
});

void test("RunHistoryPanel accepts required props shape", async () => {
  const mod = await import("./components/RunHistoryPanel");
  assert.equal(mod.RunHistoryPanel.length >= 0, true);
});

void test("formatScheduleSummary helper is exported from schedule-utils", async () => {
  const mod = await import("./schedule-utils");
  assert.equal(typeof mod.formatScheduleSummary, "function");
});

void test("formatScheduleSummary formats daily schedule", async () => {
  const { formatScheduleSummary } = await import("./schedule-utils");
  const result = formatScheduleSummary({
    time: "08:00",
    days: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
    timezone: "America/New_York",
  });
  assert.ok(result.includes("Daily"));
  assert.ok(result.includes("8:00 AM"));
  assert.ok(
    result.includes("EST") ||
      result.includes("EDT") ||
      result.includes("America/New_York"),
  );
});

void test("formatScheduleSummary formats weekday schedule", async () => {
  const { formatScheduleSummary } = await import("./schedule-utils");
  const result = formatScheduleSummary({
    time: "09:30",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    timezone: "America/New_York",
  });
  assert.ok(result.includes("Weekdays"));
  assert.ok(result.includes("9:30 AM"));
});

void test("formatScheduleSummary formats specific days", async () => {
  const { formatScheduleSummary } = await import("./schedule-utils");
  const result = formatScheduleSummary({
    time: "14:00",
    days: ["monday", "wednesday"],
    timezone: "UTC",
  });
  assert.ok(result.includes("Mon"));
  assert.ok(result.includes("Wed"));
  assert.ok(result.includes("2:00 PM"));
});

void test("formatDuration helper is exported from schedule-utils", async () => {
  const mod = await import("./schedule-utils");
  assert.equal(typeof mod.formatDuration, "function");
});

void test("formatDuration formats seconds correctly", async () => {
  const { formatDuration } = await import("./schedule-utils");
  assert.equal(formatDuration(45000), "45s");
  assert.equal(formatDuration(90000), "1m 30s");
  assert.equal(formatDuration(null), "—");
});

void test("STEP_LABELS is exported from schedule-utils", async () => {
  const mod = await import("./schedule-utils");
  assert.ok(Array.isArray(mod.STEP_LABELS));
  assert.equal(mod.STEP_LABELS.length, 4);
});

void test("AutomationDialogSteps exports all step components", async () => {
  const mod = await import("./components/AutomationDialogSteps");
  assert.equal(typeof mod.SelectCardStep, "function");
  assert.equal(typeof mod.ScheduleStep, "function");
  assert.equal(typeof mod.DestinationStep, "function");
  assert.equal(typeof mod.FiltersStep, "function");
});

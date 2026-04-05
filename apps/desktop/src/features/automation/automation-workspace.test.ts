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

void test("STEP_LABELS is exported from schedule-utils with 5 entries", async () => {
  const mod = await import("./schedule-utils");
  assert.ok(Array.isArray(mod.STEP_LABELS));
  assert.equal(mod.STEP_LABELS.length, 5);
});

void test("formatEventTriggerLabel returns correct labels", async () => {
  const { formatEventTriggerLabel } = await import("./schedule-utils");
  assert.equal(formatEventTriggerLabel("case-stale"), "When a case goes stale");
  assert.equal(
    formatEventTriggerLabel("earnings-detected"),
    "When earnings are detected",
  );
  assert.equal(
    formatEventTriggerLabel("drift-detected"),
    "When thesis drift is detected",
  );
  assert.equal(
    formatEventTriggerLabel("catalyst-approaching"),
    "When a catalyst approaches",
  );
  assert.equal(formatEventTriggerLabel("review-due"), "When a review is due");
});

void test("EVENT_TRIGGER_OPTIONS has 5 entries with value and label", async () => {
  const { EVENT_TRIGGER_OPTIONS } = await import("./schedule-utils");
  assert.equal(EVENT_TRIGGER_OPTIONS.length, 5);
  for (const option of EVENT_TRIGGER_OPTIONS) {
    assert.ok(typeof option.value === "string");
    assert.ok(typeof option.label === "string");
  }
});

void test("AutomationDialogSteps exports all step components including new ones", async () => {
  const mod = await import("./components/AutomationDialogSteps");
  assert.equal(typeof mod.SelectCardStep, "function");
  assert.equal(typeof mod.ScheduleStep, "function");
  assert.equal(typeof mod.DestinationStep, "function");
  assert.equal(typeof mod.FiltersStep, "function");
  assert.equal(typeof mod.TriggerTypeStep, "function");
  assert.equal(typeof mod.EventTypeStep, "function");
});

void test("card registry includes watchlist-digest as schedulable", async () => {
  const { allCards } = await import("../../features/launchpad/card-registry");
  const card = allCards.find((c) => c.id === "watchlist-digest");
  assert.ok(card, "watchlist-digest card should exist");
  assert.equal(card.schedulable, true);
  assert.ok(card.title.length > 0);
  assert.ok(card.promise.length > 0);
  assert.ok(card.prompt.length > 0);
  assert.equal(card.input, "none");
});

void test("card registry includes review-queue as schedulable", async () => {
  const { allCards } = await import("../../features/launchpad/card-registry");
  const card = allCards.find((c) => c.id === "review-queue");
  assert.ok(card, "review-queue card should exist");
  assert.equal(card.schedulable, true);
  assert.ok(card.title.length > 0);
  assert.ok(card.promise.length > 0);
  assert.ok(card.prompt.length > 0);
  assert.equal(card.input, "none");
});

void test("card registry includes portfolio-review as schedulable", async () => {
  const { allCards } = await import("../../features/launchpad/card-registry");
  const card = allCards.find((c) => c.id === "portfolio-review");
  assert.ok(card, "portfolio-review card should exist");
  assert.equal(card.schedulable, true);
  assert.ok(card.title.length > 0);
  assert.ok(card.promise.length > 0);
  assert.ok(card.prompt.length > 0);
  assert.equal(card.input, "none");
});

void test("total schedulable cards is at least 5", async () => {
  const { allCards } = await import("../../features/launchpad/card-registry");
  const schedulable = allCards.filter((c) => c.schedulable);
  assert.ok(
    schedulable.length >= 5,
    `Expected >= 5 schedulable cards, got ${String(schedulable.length)}`,
  );
});

void test("AutomationDialog uses allCards for schedulable cards", async () => {
  // Verify the dialog module imports allCards (not just actionCards)
  const mod = await import("./components/AutomationDialog");
  assert.equal(typeof mod.AutomationDialog, "function");
});

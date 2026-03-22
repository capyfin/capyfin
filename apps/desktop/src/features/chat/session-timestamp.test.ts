import assert from "node:assert/strict";
import test from "node:test";
import { formatSessionTimestamp } from "./session-timestamp";

// Fixed "now": 2026-03-21 14:00 UTC (Saturday)
const NOW = new Date("2026-03-21T14:00:00Z");

// --- Today: show time only ---

void test("shows time for a session updated today", () => {
  const result = formatSessionTimestamp("2026-03-21T10:30:00Z", NOW);
  // Should contain the time portion (exact format depends on locale, but must include digits)
  assert.ok(result.includes("10") || result.includes("30"), `expected time string, got "${result}"`);
  // Should NOT contain a date or month name
  assert.ok(!result.includes("Mar"), `should not contain month for today, got "${result}"`);
  assert.ok(!result.includes("Yesterday"), `should not be 'Yesterday', got "${result}"`);
});

void test("shows AM/PM time for a morning session today", () => {
  const result = formatSessionTimestamp("2026-03-21T08:15:00Z", NOW);
  // Locale-formatted time includes AM or PM
  assert.ok(/\d{1,2}:\d{2}\s*(AM|PM)/i.test(result), `expected time with AM/PM, got "${result}"`);
});

// --- Yesterday: show "Yesterday HH:MM AM/PM" ---

void test("shows 'Yesterday' with time for a session updated yesterday evening", () => {
  const result = formatSessionTimestamp("2026-03-20T22:00:00Z", NOW);
  assert.ok(result.startsWith("Yesterday"), `should start with Yesterday, got "${result}"`);
  // Must include a time portion after "Yesterday"
  assert.ok(/Yesterday\s+\d{1,2}:\d{2}\s*(AM|PM)/i.test(result), `expected 'Yesterday HH:MM AM/PM', got "${result}"`);
});

void test("shows 'Yesterday' with time for a session updated early yesterday", () => {
  const result = formatSessionTimestamp("2026-03-20T01:00:00Z", NOW);
  assert.ok(result.startsWith("Yesterday"), `should start with Yesterday, got "${result}"`);
  assert.ok(/Yesterday\s+\d{1,2}:\d{2}\s*(AM|PM)/i.test(result), `expected 'Yesterday HH:MM AM/PM', got "${result}"`);
});

void test("yesterday sessions with different times are distinguishable", () => {
  const morning = formatSessionTimestamp("2026-03-20T08:00:00Z", NOW);
  const evening = formatSessionTimestamp("2026-03-20T20:00:00Z", NOW);
  assert.notEqual(morning, evening, `morning and evening yesterday sessions should differ: "${morning}" vs "${evening}"`);
});

// --- This week: show day name ---

void test("shows day name for a session earlier this week", () => {
  // Wednesday 2026-03-18
  const result = formatSessionTimestamp("2026-03-18T12:00:00Z", NOW);
  assert.equal(result, "Wednesday");
});

void test("shows day name for Monday of this week", () => {
  // Monday 2026-03-16
  const result = formatSessionTimestamp("2026-03-16T09:00:00Z", NOW);
  assert.equal(result, "Monday");
});

// --- Older: show short date ---

void test("shows short date for a session earlier this month", () => {
  const result = formatSessionTimestamp("2026-03-10T12:00:00Z", NOW);
  assert.equal(result, "Mar 10");
});

void test("shows short date for a session from last month", () => {
  const result = formatSessionTimestamp("2026-02-15T12:00:00Z", NOW);
  assert.equal(result, "Feb 15");
});

void test("shows short date for a session from last year", () => {
  const result = formatSessionTimestamp("2025-12-01T00:00:00Z", NOW);
  assert.equal(result, "Dec 1");
});

// --- Edge cases ---

void test("handles midnight boundary (start of today)", () => {
  const todayMidnight = new Date(NOW);
  todayMidnight.setHours(0, 0, 0, 0);
  const result = formatSessionTimestamp(todayMidnight.toISOString(), NOW);
  // Should be time format (today), not "Yesterday"
  assert.ok(!result.includes("Yesterday"), `midnight today should not be Yesterday, got "${result}"`);
});

void test("handles end of yesterday", () => {
  const yesterdayEnd = new Date(NOW);
  yesterdayEnd.setHours(0, 0, 0, 0);
  yesterdayEnd.setMilliseconds(-1); // 23:59:59.999 the day before
  const result = formatSessionTimestamp(yesterdayEnd.toISOString(), NOW);
  assert.ok(result.startsWith("Yesterday"), `should start with Yesterday, got "${result}"`);
  assert.ok(/Yesterday\s+\d{1,2}:\d{2}\s*(AM|PM)/i.test(result), `expected 'Yesterday HH:MM AM/PM', got "${result}"`);
});

import assert from "node:assert/strict";
import test from "node:test";
import { toChatActivityChunk } from "./chat-activity.ts";

void test("maps lifecycle events to activity chunks", () => {
  const chunk = toChatActivityChunk({
    data: { phase: "start" },
    runId: "run-1",
    seq: 1,
    stream: "lifecycle",
    ts: Date.UTC(2026, 2, 16),
  });

  assert.deepEqual(chunk, {
    data: {
      id: "run:run-1:status",
      kind: "status",
      label: "Thinking",
      sequence: 1,
      status: "active",
      timestamp: "2026-03-16T00:00:00.000Z",
    },
    id: "run:run-1:status",
    type: "data-activity",
  });
});

void test("maps tool completion events to completed activity chunks", () => {
  const chunk = toChatActivityChunk({
    data: {
      name: "web_search",
      phase: "result",
      toolCallId: "tool-1",
    },
    runId: "run-1",
    seq: 4,
    stream: "tool",
    ts: Date.UTC(2026, 2, 16, 0, 0, 4),
  });

  assert.deepEqual(chunk, {
    data: {
      detail: "Finished and incorporated the result.",
      id: "run:run-1:tool:tool-1",
      kind: "tool",
      label: "Using Search",
      sequence: 4,
      status: "complete",
      timestamp: "2026-03-16T00:00:04.000Z",
      toolName: "web_search",
    },
    id: "run:run-1:tool:tool-1",
    type: "data-activity",
  });
});

void test("ignores unsupported streams", () => {
  const chunk = toChatActivityChunk({
    data: { text: "hello" },
    runId: "run-1",
    seq: 2,
    stream: "assistant",
  });

  assert.equal(chunk, null);
});

function getLabel(
  chunk: ReturnType<typeof toChatActivityChunk>,
): string | undefined {
  if (!chunk || !("data" in chunk)) {
    return undefined;
  }
  return (chunk.data as { label?: string }).label;
}

void test("humanizes financial tool names for stock analysis", () => {
  const chunk = toChatActivityChunk({
    data: { name: "stock_analysis", phase: "start", toolCallId: "tool-fin-1" },
    runId: "run-2",
    seq: 1,
    stream: "tool",
  });
  assert.equal(getLabel(chunk), "Using Stock analysis");
});

void test("humanizes financial tool names for portfolio analyzer", () => {
  const chunk = toChatActivityChunk({
    data: {
      name: "portfolio_analyzer",
      phase: "start",
      toolCallId: "tool-fin-2",
    },
    runId: "run-2",
    seq: 2,
    stream: "tool",
  });
  assert.equal(getLabel(chunk), "Using Portfolio analysis");
});

void test("humanizes financial tool names for earnings", () => {
  const chunk = toChatActivityChunk({
    data: {
      name: "earnings_summary",
      phase: "start",
      toolCallId: "tool-fin-3",
    },
    runId: "run-2",
    seq: 3,
    stream: "tool",
  });
  assert.equal(getLabel(chunk), "Using Earnings review");
});

void test("humanizes financial tool names for market screener", () => {
  const chunk = toChatActivityChunk({
    data: { name: "market_screener", phase: "start", toolCallId: "tool-fin-4" },
    runId: "run-2",
    seq: 4,
    stream: "tool",
  });
  assert.equal(getLabel(chunk), "Using Stock screener");
});

void test("humanizes financial tool names for market overview", () => {
  const chunk = toChatActivityChunk({
    data: { name: "market_overview", phase: "start", toolCallId: "tool-fin-5" },
    runId: "run-2",
    seq: 5,
    stream: "tool",
  });
  assert.equal(getLabel(chunk), "Using Market overview");
});

void test("humanizes financial tool names for quote fetching", () => {
  const chunk = toChatActivityChunk({
    data: { name: "get_stock_quote", phase: "start", toolCallId: "tool-fin-6" },
    runId: "run-2",
    seq: 6,
    stream: "tool",
  });
  assert.equal(getLabel(chunk), "Using Quote lookup");
});

void test("humanizes financial tool names for dividend checking", () => {
  const chunk = toChatActivityChunk({
    data: { name: "check_dividends", phase: "start", toolCallId: "tool-fin-7" },
    runId: "run-2",
    seq: 7,
    stream: "tool",
  });
  assert.equal(getLabel(chunk), "Using Dividend check");
});

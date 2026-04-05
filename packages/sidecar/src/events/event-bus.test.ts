import assert from "node:assert/strict";
import test from "node:test";
import { AutomationEventBus, type AttentionChangeEvent } from "./event-bus.ts";

void test("emitAttentionChange delivers event to subscriber", () => {
  const bus = new AutomationEventBus();
  const received: AttentionChangeEvent[] = [];

  bus.onAttentionChange((event) => {
    received.push(event);
  });

  const event: AttentionChangeEvent = {
    item: {
      id: "item-1",
      caseId: "case-1",
      ticker: "AAPL",
      companyName: "Apple Inc.",
      reason: "AAPL has not been reviewed in 35 days",
      urgency: "medium",
      attentionState: "stale",
      detectedAt: new Date().toISOString(),
      dismissed: false,
    },
    isNew: true,
  };

  bus.emitAttentionChange(event);
  assert.equal(received.length, 1);
  assert.deepEqual(received[0], event);
});

void test("offAttentionChange removes listener", () => {
  const bus = new AutomationEventBus();
  const received: AttentionChangeEvent[] = [];

  const handler = (event: AttentionChangeEvent) => {
    received.push(event);
  };

  bus.onAttentionChange(handler);
  bus.offAttentionChange(handler);

  bus.emitAttentionChange({
    item: {
      id: "item-2",
      caseId: "case-2",
      ticker: "MSFT",
      companyName: "Microsoft",
      reason: "test",
      urgency: "high",
      attentionState: "drift-detected",
      detectedAt: new Date().toISOString(),
      dismissed: false,
    },
    isNew: true,
  });

  assert.equal(received.length, 0);
});

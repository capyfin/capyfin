import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AutomationEventBus } from "../events/event-bus.ts";
import { AutomationService } from "./service.ts";
import { AutomationEventListener } from "./event-listener.ts";

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "event-listener-test-"));
}

function makeEventAutomation(eventType: string) {
  return {
    cardId: "morning-brief",
    cardTitle: "Morning Brief",
    trigger: { type: "event" as const, eventType: eventType as "case-stale" },
    destination: "library" as const,
    enabled: true,
  };
}

void test("case-stale attention event matches automation with eventType case-stale", async () => {
  const dir = await createTempDir();
  try {
    const bus = new AutomationEventBus();
    const service = new AutomationService(dir);
    await service.create(makeEventAutomation("case-stale"));

    const listener = new AutomationEventListener(bus, service);
    listener.start();

    bus.emitAttentionChange({
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
    });

    await new Promise((r) => setTimeout(r, 50));

    const automations = await service.list();
    assert.equal(automations.length, 1);
    const firstAuto = automations[0];
    assert.ok(firstAuto);
    const runs = await service.listRuns(firstAuto.id);
    assert.equal(runs.length, 1);
    const firstRun = runs[0];
    assert.ok(firstRun);
    assert.ok(
      typeof firstRun.lastTriggeredBy === "string" &&
        firstRun.lastTriggeredBy.includes("case-stale"),
    );

    listener.stop();
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("drift-detected attention event matches drift-detected automation", async () => {
  const dir = await createTempDir();
  try {
    const bus = new AutomationEventBus();
    const service = new AutomationService(dir);
    await service.create(makeEventAutomation("drift-detected"));

    const listener = new AutomationEventListener(bus, service);
    listener.start();

    bus.emitAttentionChange({
      item: {
        id: "item-2",
        caseId: "case-2",
        ticker: "NVDA",
        companyName: "NVIDIA",
        reason: "NVDA has unresolved thesis drift",
        urgency: "high",
        attentionState: "drift-detected",
        detectedAt: new Date().toISOString(),
        dismissed: false,
      },
      isNew: true,
    });

    await new Promise((r) => setTimeout(r, 50));

    const automations = await service.list();
    assert.equal(automations.length, 1);
    const firstAuto = automations[0];
    assert.ok(firstAuto);
    const runs = await service.listRuns(firstAuto.id);
    assert.equal(runs.length, 1);

    listener.stop();
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("catalyst-upcoming attention event matches catalyst-approaching automation", async () => {
  const dir = await createTempDir();
  try {
    const bus = new AutomationEventBus();
    const service = new AutomationService(dir);
    await service.create(makeEventAutomation("catalyst-approaching"));

    const listener = new AutomationEventListener(bus, service);
    listener.start();

    bus.emitAttentionChange({
      item: {
        id: "item-3",
        caseId: "case-3",
        ticker: "META",
        companyName: "Meta Platforms",
        reason: "META has an upcoming catalyst: product launch in 5 days",
        urgency: "medium",
        attentionState: "catalyst-upcoming",
        detectedAt: new Date().toISOString(),
        dismissed: false,
      },
      isNew: true,
    });

    await new Promise((r) => setTimeout(r, 50));

    const automations = await service.list();
    assert.equal(automations.length, 1);
    const firstAuto = automations[0];
    assert.ok(firstAuto);
    const runs = await service.listRuns(firstAuto.id);
    assert.equal(runs.length, 1);

    listener.stop();
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("catalyst-upcoming with earnings keyword also matches earnings-detected automation", async () => {
  const dir = await createTempDir();
  try {
    const bus = new AutomationEventBus();
    const service = new AutomationService(dir);
    await service.create(makeEventAutomation("earnings-detected"));

    const listener = new AutomationEventListener(bus, service);
    listener.start();

    bus.emitAttentionChange({
      item: {
        id: "item-4",
        caseId: "case-4",
        ticker: "GOOG",
        companyName: "Alphabet",
        reason: "GOOG has an upcoming catalyst: Q1 earnings in 3 days",
        urgency: "medium",
        attentionState: "catalyst-upcoming",
        detectedAt: new Date().toISOString(),
        dismissed: false,
      },
      isNew: true,
    });

    await new Promise((r) => setTimeout(r, 50));

    const automations = await service.list();
    assert.equal(automations.length, 1);
    const firstAuto = automations[0];
    assert.ok(firstAuto);
    const runs = await service.listRuns(firstAuto.id);
    assert.equal(runs.length, 1);
    const earningsRun = runs[0];
    assert.ok(earningsRun);
    assert.ok(
      typeof earningsRun.lastTriggeredBy === "string" &&
        earningsRun.lastTriggeredBy.includes("earnings-detected"),
    );

    listener.stop();
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("review-now attention event matches review-due automation", async () => {
  const dir = await createTempDir();
  try {
    const bus = new AutomationEventBus();
    const service = new AutomationService(dir);
    await service.create(makeEventAutomation("review-due"));

    const listener = new AutomationEventListener(bus, service);
    listener.start();

    bus.emitAttentionChange({
      item: {
        id: "item-5",
        caseId: "case-5",
        ticker: "AMZN",
        companyName: "Amazon",
        reason: "AMZN has not been reviewed in 50 days",
        urgency: "high",
        attentionState: "review-now",
        detectedAt: new Date().toISOString(),
        dismissed: false,
      },
      isNew: true,
    });

    await new Promise((r) => setTimeout(r, 50));

    const automations = await service.list();
    assert.equal(automations.length, 1);
    const firstAuto = automations[0];
    assert.ok(firstAuto);
    const runs = await service.listRuns(firstAuto.id);
    assert.equal(runs.length, 1);

    listener.stop();
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("disabled automation is not triggered", async () => {
  const dir = await createTempDir();
  try {
    const bus = new AutomationEventBus();
    const service = new AutomationService(dir);
    const auto = await service.create(makeEventAutomation("case-stale"));
    await service.update(auto.id, { enabled: false });

    const listener = new AutomationEventListener(bus, service);
    listener.start();

    bus.emitAttentionChange({
      item: {
        id: "item-6",
        caseId: "case-6",
        ticker: "TSLA",
        companyName: "Tesla",
        reason: "TSLA has not been reviewed in 35 days",
        urgency: "medium",
        attentionState: "stale",
        detectedAt: new Date().toISOString(),
        dismissed: false,
      },
      isNew: true,
    });

    await new Promise((r) => setTimeout(r, 50));

    const runs = await service.listRuns(auto.id);
    assert.equal(runs.length, 0);

    listener.stop();
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("isNew false events are ignored", async () => {
  const dir = await createTempDir();
  try {
    const bus = new AutomationEventBus();
    const service = new AutomationService(dir);
    await service.create(makeEventAutomation("case-stale"));

    const listener = new AutomationEventListener(bus, service);
    listener.start();

    bus.emitAttentionChange({
      item: {
        id: "item-7",
        caseId: "case-7",
        ticker: "NFLX",
        companyName: "Netflix",
        reason: "NFLX has not been reviewed in 35 days",
        urgency: "medium",
        attentionState: "stale",
        detectedAt: new Date().toISOString(),
        dismissed: false,
      },
      isNew: false,
    });

    await new Promise((r) => setTimeout(r, 50));

    const automations = await service.list();
    assert.equal(automations.length, 1);
    const firstAuto = automations[0];
    assert.ok(firstAuto);
    const runs = await service.listRuns(firstAuto.id);
    assert.equal(runs.length, 0);

    listener.stop();
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("healthy attention state does not trigger any automation", async () => {
  const dir = await createTempDir();
  try {
    const bus = new AutomationEventBus();
    const service = new AutomationService(dir);
    await service.create(makeEventAutomation("case-stale"));
    await service.create(makeEventAutomation("review-due"));

    const listener = new AutomationEventListener(bus, service);
    listener.start();

    bus.emitAttentionChange({
      item: {
        id: "item-8",
        caseId: "case-8",
        ticker: "DIS",
        companyName: "Disney",
        reason: "DIS is healthy",
        urgency: "low",
        attentionState: "healthy" as "stale", // cast for test — healthy shouldn't match
        detectedAt: new Date().toISOString(),
        dismissed: false,
      },
      isNew: true,
    });

    await new Promise((r) => setTimeout(r, 50));

    const all = await service.list();
    for (const auto of all) {
      const runs = await service.listRuns(auto.id);
      assert.equal(runs.length, 0);
    }

    listener.stop();
  } finally {
    await rm(dir, { recursive: true });
  }
});

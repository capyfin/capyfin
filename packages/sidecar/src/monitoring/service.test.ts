import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { MonitoringService } from "./service.ts";
import type { InvestmentCase } from "@capyfin/contracts";

function makeCase(overrides: Partial<InvestmentCase> = {}): InvestmentCase {
  const now = new Date().toISOString();
  return {
    id: "case-1",
    ticker: "AAPL",
    companyName: "Apple Inc.",
    stance: "bullish",
    confidence: "HIGH",
    lastReviewedAt: now,
    createdAt: now,
    updatedAt: now,
    sections: [],
    keyAssumptions: [],
    invalidationSignals: [],
    nextActions: [],
    history: [],
    tags: [],
    monitoringEnabled: true,
    staleDays: 30,
    attentionState: "stale",
    ...overrides,
  };
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/** Fake CasesService that returns canned cases */
function fakeCasesService(cases: InvestmentCase[]) {
  return {
    listCases: () => Promise.resolve(cases),
  };
}

void test("scan() persists items to attention-items.json", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mon-test-"));
  try {
    const cases = [
      makeCase({ attentionState: "stale", lastReviewedAt: daysAgo(35) }),
    ];
    const service = new MonitoringService(
      dir,
      fakeCasesService(cases) as never,
    );
    await service.scan();

    const raw = await readFile(join(dir, "attention-items.json"), "utf-8");
    const data = JSON.parse(raw) as { items: unknown[]; lastScanAt: string };
    assert.equal(data.items.length, 1);
    assert.ok(data.lastScanAt);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("getItems() returns undismissed items", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mon-test-"));
  try {
    const cases = [
      makeCase({ attentionState: "stale", lastReviewedAt: daysAgo(35) }),
    ];
    const service = new MonitoringService(
      dir,
      fakeCasesService(cases) as never,
    );
    await service.scan();

    const result = await service.getItems();
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.dismissed, false);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("getItems() filters by urgency", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mon-test-"));
  try {
    const cases = [
      makeCase({
        id: "case-1",
        attentionState: "stale",
        lastReviewedAt: daysAgo(35),
      }),
      makeCase({
        id: "case-2",
        ticker: "NVDA",
        companyName: "NVIDIA Corp.",
        attentionState: "review-now",
        lastReviewedAt: daysAgo(50),
      }),
    ];
    const service = new MonitoringService(
      dir,
      fakeCasesService(cases) as never,
    );
    await service.scan();

    const highOnly = await service.getItems({ urgency: "high" });
    assert.equal(highOnly.items.length, 1);
    assert.equal(highOnly.items[0]?.ticker, "NVDA");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("getItems() filters by attentionState", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mon-test-"));
  try {
    const cases = [
      makeCase({
        id: "case-1",
        attentionState: "stale",
        lastReviewedAt: daysAgo(35),
      }),
      makeCase({
        id: "case-2",
        ticker: "NVDA",
        companyName: "NVIDIA Corp.",
        attentionState: "review-now",
        lastReviewedAt: daysAgo(50),
      }),
    ];
    const service = new MonitoringService(
      dir,
      fakeCasesService(cases) as never,
    );
    await service.scan();

    const staleOnly = await service.getItems({ attentionState: "stale" });
    assert.equal(staleOnly.items.length, 1);
    assert.equal(staleOnly.items[0]?.attentionState, "stale");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("dismissItem() sets dismissed to true and persists", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mon-test-"));
  try {
    const cases = [
      makeCase({ attentionState: "stale", lastReviewedAt: daysAgo(35) }),
    ];
    const service = new MonitoringService(
      dir,
      fakeCasesService(cases) as never,
    );
    await service.scan();

    const items = await service.getItems({ includeDismissed: true });
    const itemId = items.items[0]?.id;
    assert.ok(itemId);

    const dismissed = await service.dismissItem(itemId);
    assert.equal(dismissed.dismissed, true);

    // Verify persistence
    const raw = await readFile(join(dir, "attention-items.json"), "utf-8");
    const data = JSON.parse(raw) as { items: { dismissed: boolean }[] };
    assert.equal(data.items[0]?.dismissed, true);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("dismissItem() with unknown id throws error", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mon-test-"));
  try {
    const service = new MonitoringService(dir, fakeCasesService([]) as never);
    await assert.rejects(() => service.dismissItem("nonexistent"), {
      message: /not found/i,
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("start() / stop() manages interval lifecycle", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mon-test-"));
  try {
    const cases = [
      makeCase({ attentionState: "stale", lastReviewedAt: daysAgo(35) }),
    ];
    const service = new MonitoringService(
      dir,
      fakeCasesService(cases) as never,
      60_000, // short interval
    );
    service.start();

    // Wait for initial scan to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify initial scan ran
    const items = await service.getItems({ includeDismissed: true });
    assert.equal(items.items.length, 1);

    service.stop();
  } finally {
    await rm(dir, { recursive: true });
  }
});

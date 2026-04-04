import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { CasesService } from "./service.ts";

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "cases-test-"));
}

void test("listCases returns empty array when no file exists", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const cases = await service.listCases();
    assert.deepEqual(cases, []);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("createCase generates ID, timestamps, and returns valid case", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const before = new Date().toISOString();
    const created = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
      stance: "bullish",
      confidence: "HIGH",
    });
    const after = new Date().toISOString();
    assert.ok(created.id.length > 0);
    assert.equal(created.ticker, "AAPL");
    assert.equal(created.companyName, "Apple Inc.");
    assert.equal(created.stance, "bullish");
    assert.equal(created.confidence, "HIGH");
    assert.ok(created.createdAt >= before && created.createdAt <= after);
    assert.ok(created.updatedAt >= before && created.updatedAt <= after);
    assert.equal(created.lastReviewedAt, created.createdAt);
    assert.deepEqual(created.sections, []);
    assert.deepEqual(created.keyAssumptions, []);
    assert.deepEqual(created.invalidationSignals, []);
    assert.deepEqual(created.nextActions, []);
    assert.deepEqual(created.history, []);
    assert.deepEqual(created.tags, []);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("createCase uses provided optional fields", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const created = await service.createCase({
      ticker: "MSFT",
      companyName: "Microsoft",
      keyAssumptions: ["Cloud growth"],
      tags: ["tech"],
    });
    assert.equal(created.stance, "watching");
    assert.equal(created.confidence, "MEDIUM");
    assert.deepEqual(created.keyAssumptions, ["Cloud growth"]);
    assert.deepEqual(created.tags, ["tech"]);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("getCase returns existing case", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const created = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
    });
    const fetched = await service.getCase(created.id);
    assert.deepEqual(fetched, created);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("getCase throws for missing ID", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await assert.rejects(() => service.getCase("nonexistent-id"), {
      message: "Case not found: nonexistent-id",
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("updateCase merges partial fields and updates updatedAt", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const created = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
      stance: "watching",
      confidence: "LOW",
    });
    // small delay to ensure updatedAt differs
    await new Promise((resolve) => setTimeout(resolve, 10));
    const updated = await service.updateCase(created.id, {
      stance: "bullish",
      confidence: "HIGH",
      tags: ["tech", "mega-cap"],
    });
    assert.equal(updated.id, created.id);
    assert.equal(updated.stance, "bullish");
    assert.equal(updated.confidence, "HIGH");
    assert.deepEqual(updated.tags, ["tech", "mega-cap"]);
    assert.equal(updated.ticker, "AAPL");
    assert.equal(updated.companyName, "Apple Inc.");
    assert.ok(updated.updatedAt > created.updatedAt);
    assert.equal(updated.createdAt, created.createdAt);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("updateCase throws for missing ID", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await assert.rejects(
      () => service.updateCase("nonexistent-id", { stance: "bullish" }),
      { message: "Case not found: nonexistent-id" },
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("deleteCase removes case and returns deleted: true", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const created = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
    });
    const result = await service.deleteCase(created.id);
    assert.deepEqual(result, { deleted: true });
    const cases = await service.listCases();
    assert.equal(cases.length, 0);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("deleteCase throws for missing ID", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await assert.rejects(() => service.deleteCase("nonexistent-id"), {
      message: "Case not found: nonexistent-id",
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("addHistoryEntry appends to case history and preserves existing entries", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const created = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
    });
    const entry1 = await service.addHistoryEntry(created.id, {
      eventType: "created",
      summary: "Initial case created",
    });
    assert.ok(entry1.id.length > 0);
    assert.equal(entry1.eventType, "created");
    assert.equal(entry1.summary, "Initial case created");
    assert.ok(entry1.date.length > 0);

    const entry2 = await service.addHistoryEntry(created.id, {
      eventType: "refreshed",
      summary: "Refreshed after Q1 earnings",
      priorStance: "watching",
      newStance: "bullish",
      priorConfidence: "MEDIUM",
      newConfidence: "HIGH",
    });
    assert.equal(entry2.eventType, "refreshed");

    const fetched = await service.getCase(created.id);
    assert.equal(fetched.history.length, 2);
    assert.equal(fetched.history.at(0)?.summary, "Initial case created");
    assert.equal(fetched.history.at(1)?.summary, "Refreshed after Q1 earnings");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("addHistoryEntry throws for missing case ID", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await assert.rejects(
      () =>
        service.addHistoryEntry("nonexistent-id", {
          eventType: "created",
          summary: "test",
        }),
      { message: "Case not found: nonexistent-id" },
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("multiple cases for same ticker (UUID-keyed)", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const case1 = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
      tags: ["2024"],
    });
    const case2 = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
      tags: ["2025"],
    });
    assert.notEqual(case1.id, case2.id);
    const cases = await service.listCases();
    assert.equal(cases.length, 2);
    assert.ok(cases.some((c) => c.id === case1.id));
    assert.ok(cases.some((c) => c.id === case2.id));
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("data persists across service instances", async () => {
  const dir = await createTempDir();
  try {
    const service1 = new CasesService(dir);
    await service1.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
    });
    await service1.createCase({
      ticker: "MSFT",
      companyName: "Microsoft",
    });

    const service2 = new CasesService(dir);
    const cases = await service2.listCases();
    assert.equal(cases.length, 2);
    assert.ok(cases.some((c) => c.ticker === "AAPL"));
    assert.ok(cases.some((c) => c.ticker === "MSFT"));
  } finally {
    await rm(dir, { recursive: true });
  }
});

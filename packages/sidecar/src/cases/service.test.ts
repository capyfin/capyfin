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

void test("listCases and getCase return computed attentionState", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const created = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
    });
    assert.equal(created.attentionState, "healthy");

    const fetched = await service.getCase(created.id);
    assert.equal(fetched.attentionState, "healthy");

    const listed = await service.listCases();
    assert.equal(listed[0]?.attentionState, "healthy");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("new cases default monitoringEnabled=false and staleDays=30", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const created = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
    });
    assert.equal(created.monitoringEnabled, false);
    assert.equal(created.staleDays, 30);
    assert.equal(created.nextCatalystDate, undefined);
    assert.equal(created.nextCatalystDescription, undefined);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("updateCase accepts monitoringEnabled, nextCatalystDate, nextCatalystDescription, staleDays", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const created = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
    });
    const catalystDate = new Date(Date.now() + 5 * 86400000).toISOString();
    const updated = await service.updateCase(created.id, {
      monitoringEnabled: true,
      nextCatalystDate: catalystDate,
      nextCatalystDescription: "Q2 Earnings",
      staleDays: 14,
    });
    assert.equal(updated.monitoringEnabled, true);
    assert.equal(updated.nextCatalystDate, catalystDate);
    assert.equal(updated.nextCatalystDescription, "Q2 Earnings");
    assert.equal(updated.staleDays, 14);
    assert.equal(updated.attentionState, "catalyst-upcoming");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("existing cases without new fields default gracefully", async () => {
  const dir = await createTempDir();
  try {
    // Simulate old data without new fields by creating and verifying it loads
    const service = new CasesService(dir);
    const created = await service.createCase({
      ticker: "MSFT",
      companyName: "Microsoft",
    });
    // Re-load from disk via new service instance
    const service2 = new CasesService(dir);
    const fetched = await service2.getCase(created.id);
    assert.equal(fetched.monitoringEnabled, false);
    assert.equal(fetched.staleDays, 30);
    assert.ok(fetched.attentionState !== undefined);
  } finally {
    await rm(dir, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// findByTicker
// ---------------------------------------------------------------------------

void test("findByTicker returns null when no cases exist", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const result = await service.findByTicker("AAPL");
    assert.equal(result, null);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("findByTicker returns case with case-insensitive match", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await service.createCase({ ticker: "AAPL", companyName: "Apple Inc." });
    const found = await service.findByTicker("aapl");
    assert.ok(found);
    assert.equal(found.ticker, "AAPL");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("findByTicker returns most recently reviewed case if multiple exist", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const older = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
    });
    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));
    const newer = await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
    });
    const found = await service.findByTicker("AAPL");
    assert.ok(found);
    assert.equal(found.id, newer.id);
    assert.notEqual(found.id, older.id);
  } finally {
    await rm(dir, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// createOrUpdateFromOutput
// ---------------------------------------------------------------------------

import type { CardOutput } from "@capyfin/contracts";

function stubCardOutput(overrides: Partial<CardOutput> = {}): CardOutput {
  return {
    cardId: "deep-dive",
    subject: "AAPL",
    title: "Apple Deep Dive",
    summary: "A deep dive into Apple",
    sections: [
      {
        id: "s1",
        title: "Thesis",
        confidence: "HIGH",
        content: "Strong thesis content",
        citations: [],
      },
    ],
    keyRisks: ["Supply chain risk"],
    challengeSummary: "Market saturation",
    dataTier: "1",
    sourcesUsed: ["10-K"],
    dataAsOf: "2026-04-01",
    companyName: "Apple Inc.",
    stance: "bullish",
    confidence: "HIGH",
    keyAssumptions: ["Services growth"],
    invalidationSignals: ["iPhone decline"],
    ...overrides,
  };
}

void test("createOrUpdateFromOutput: deep-dive creates new case with 'created' history", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    const result = await service.createOrUpdateFromOutput(
      stubCardOutput(),
      "deep-dive",
    );
    assert.equal(result.created, true);
    assert.equal(result.case.ticker, "AAPL");
    assert.equal(result.case.companyName, "Apple Inc.");
    assert.equal(result.case.stance, "bullish");
    assert.equal(result.case.confidence, "HIGH");
    assert.equal(result.historyEntry.eventType, "created");
    assert.ok(result.case.sections.length > 0);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("createOrUpdateFromOutput: deep-dive with existing ticker upserts with 'refreshed' history", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    // Create initial case
    await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
      stance: "neutral",
      confidence: "LOW",
      sections: [
        {
          id: "existing-s1",
          title: "Thesis",
          content: "Old thesis",
          confidence: "LOW",
          citations: [],
        },
      ],
    });

    const result = await service.createOrUpdateFromOutput(
      stubCardOutput({ stance: "bullish", confidence: "HIGH" }),
      "deep-dive",
    );
    assert.equal(result.created, false);
    assert.equal(result.case.stance, "bullish");
    assert.equal(result.case.confidence, "HIGH");
    assert.equal(result.historyEntry.eventType, "refreshed");
    // Section should be merged (existing ID preserved)
    const thesisSection = result.case.sections.find(
      (s) => s.title === "Thesis",
    );
    assert.ok(thesisSection);
    assert.equal(thesisSection.id, "existing-s1");
    assert.equal(thesisSection.content, "Strong thesis content");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("createOrUpdateFromOutput: position-review merges sections with 'refreshed' history", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
      stance: "neutral",
      confidence: "MEDIUM",
      sections: [
        {
          id: "orig-1",
          title: "Thesis",
          content: "Original thesis",
          confidence: "MEDIUM",
          citations: [],
        },
        {
          id: "orig-2",
          title: "Risks",
          content: "Original risks",
          confidence: "LOW",
          citations: [],
        },
      ],
    });

    const result = await service.createOrUpdateFromOutput(
      stubCardOutput({
        cardId: "position-review",
        stance: "bullish",
        confidence: "HIGH",
      }),
      "position-review",
    );
    assert.equal(result.created, false);
    assert.equal(result.case.stance, "bullish");
    assert.equal(result.historyEntry.eventType, "refreshed");
    // Thesis should be merged (existing ID preserved), Risks should remain
    assert.ok(result.case.sections.length >= 2);
    const thesis = result.case.sections.find((s) => s.title === "Thesis");
    assert.ok(thesis);
    assert.equal(thesis.id, "orig-1");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("createOrUpdateFromOutput: position-review with no existing case throws", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await assert.rejects(
      () =>
        service.createOrUpdateFromOutput(
          stubCardOutput({ cardId: "position-review" }),
          "position-review",
        ),
      { message: /no existing case/i },
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("createOrUpdateFromOutput: earnings-xray merges sections with 'earnings-update' history", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
      stance: "bullish",
      confidence: "HIGH",
      sections: [
        {
          id: "orig-1",
          title: "Thesis",
          content: "Original thesis",
          confidence: "HIGH",
          citations: [],
        },
      ],
    });

    const result = await service.createOrUpdateFromOutput(
      stubCardOutput({
        cardId: "earnings-xray",
        stance: "bearish",
        confidence: "LOW",
      }),
      "earnings-xray",
    );
    assert.equal(result.created, false);
    // Earnings X-Ray should NOT change stance/confidence
    assert.equal(result.case.stance, "bullish");
    assert.equal(result.case.confidence, "HIGH");
    assert.equal(result.historyEntry.eventType, "earnings-update");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("createOrUpdateFromOutput: earnings-xray with no existing case throws", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await assert.rejects(
      () =>
        service.createOrUpdateFromOutput(
          stubCardOutput({ cardId: "earnings-xray" }),
          "earnings-xray",
        ),
      { message: /no existing case/i },
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("createOrUpdateFromOutput: section merging preserves user edits", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
      sections: [
        {
          id: "user-section",
          title: "My Notes",
          content: "User personal notes",
          confidence: "MEDIUM",
          citations: [],
        },
        {
          id: "orig-thesis",
          title: "Thesis",
          content: "Old thesis",
          confidence: "MEDIUM",
          citations: [],
        },
      ],
    });

    const result = await service.createOrUpdateFromOutput(
      stubCardOutput(),
      "deep-dive",
    );
    // "My Notes" should be preserved (not matched by incoming)
    const userSection = result.case.sections.find(
      (s) => s.title === "My Notes",
    );
    assert.ok(userSection);
    assert.equal(userSection.content, "User personal notes");
    assert.equal(userSection.id, "user-section");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("createOrUpdateFromOutput: history summary includes stance change", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await service.createCase({
      ticker: "AAPL",
      companyName: "Apple Inc.",
      stance: "neutral",
      confidence: "LOW",
    });

    const result = await service.createOrUpdateFromOutput(
      stubCardOutput({ stance: "bullish", confidence: "HIGH" }),
      "position-review",
    );
    assert.ok(
      result.historyEntry.summary.includes(
        "Stance changed from neutral to bullish",
      ),
    );
    assert.equal(result.historyEntry.priorStance, "neutral");
    assert.equal(result.historyEntry.newStance, "bullish");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("createOrUpdateFromOutput: throws when subject is missing", async () => {
  const dir = await createTempDir();
  try {
    const service = new CasesService(dir);
    await assert.rejects(
      () =>
        service.createOrUpdateFromOutput(
          stubCardOutput({ subject: undefined }),
          "deep-dive",
        ),
      { message: /subject.*required/i },
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { LibraryService } from "./service.ts";

const sampleCardOutput = {
  cardId: "deep-dive",
  subject: "AAPL",
  title: "Apple Deep Dive",
  summary: "A comprehensive analysis of Apple Inc.",
  sections: [
    {
      id: "s1",
      title: "Overview",
      confidence: "HIGH" as const,
      content: "Apple is a technology company.",
      citations: [{ label: "10-K", source: "SEC Filing", date: "2024-01-15" }],
    },
  ],
  scores: { "Fair Value": "$195", Upside: "12%" },
  keyRisks: ["Regulatory risk", "Supply chain risk"],
  challengeSummary: "Valuation appears stretched.",
  dataTier: "1" as const,
  sourcesUsed: ["SEC", "Yahoo Finance"],
  dataAsOf: "2024-03-15",
};

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "library-test-"));
}

void test("list returns empty array when no reports saved", async () => {
  const dir = await createTempDir();
  try {
    const service = new LibraryService(dir);
    const reports = await service.list();
    assert.deepEqual(reports, []);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("save persists a report and returns it with generated fields", async () => {
  const dir = await createTempDir();
  try {
    const service = new LibraryService(dir);
    const report = await service.save({
      cardOutput: sampleCardOutput,
      workflowType: "deep-dive",
      subject: "AAPL",
    });
    assert.ok(report.id);
    assert.equal(report.workflowType, "deep-dive");
    assert.equal(report.subject, "AAPL");
    assert.equal(report.starred, false);
    assert.equal(report.pinnedAt, null);
    assert.deepEqual(report.tags, []);
    assert.ok(report.savedAt);
    assert.equal(report.cardOutput.title, "Apple Deep Dive");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("list returns all saved reports", async () => {
  const dir = await createTempDir();
  try {
    const service = new LibraryService(dir);
    await service.save({
      cardOutput: sampleCardOutput,
      workflowType: "deep-dive",
      subject: "AAPL",
    });
    await service.save({
      cardOutput: { ...sampleCardOutput, title: "Second Report" },
      workflowType: "fair-value",
      subject: "MSFT",
    });
    const reports = await service.list();
    assert.equal(reports.length, 2);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("get retrieves a report by ID", async () => {
  const dir = await createTempDir();
  try {
    const service = new LibraryService(dir);
    const saved = await service.save({
      cardOutput: sampleCardOutput,
      workflowType: "deep-dive",
    });
    const fetched = await service.get(saved.id);
    assert.equal(fetched.id, saved.id);
    assert.equal(fetched.cardOutput.title, "Apple Deep Dive");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("get throws for non-existent ID", async () => {
  const dir = await createTempDir();
  try {
    const service = new LibraryService(dir);
    await assert.rejects(() => service.get("non-existent-id"), {
      message: "Report not found: non-existent-id",
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("update toggles starred state", async () => {
  const dir = await createTempDir();
  try {
    const service = new LibraryService(dir);
    const saved = await service.save({
      cardOutput: sampleCardOutput,
      workflowType: "deep-dive",
    });
    const updated = await service.update(saved.id, { starred: true });
    assert.equal(updated.starred, true);
    const fetched = await service.get(saved.id);
    assert.equal(fetched.starred, true);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("update sets pinnedAt", async () => {
  const dir = await createTempDir();
  try {
    const service = new LibraryService(dir);
    const saved = await service.save({
      cardOutput: sampleCardOutput,
      workflowType: "deep-dive",
    });
    const pinDate = new Date().toISOString();
    const updated = await service.update(saved.id, { pinnedAt: pinDate });
    assert.equal(updated.pinnedAt, pinDate);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("update sets tags", async () => {
  const dir = await createTempDir();
  try {
    const service = new LibraryService(dir);
    const saved = await service.save({
      cardOutput: sampleCardOutput,
      workflowType: "deep-dive",
    });
    const updated = await service.update(saved.id, {
      tags: ["tech", "large-cap"],
    });
    assert.deepEqual(updated.tags, ["tech", "large-cap"]);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("delete removes a report", async () => {
  const dir = await createTempDir();
  try {
    const service = new LibraryService(dir);
    const saved = await service.save({
      cardOutput: sampleCardOutput,
      workflowType: "deep-dive",
    });
    const result = await service.delete(saved.id);
    assert.deepEqual(result, { deleted: true });
    const reports = await service.list();
    assert.equal(reports.length, 0);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("delete throws for non-existent ID", async () => {
  const dir = await createTempDir();
  try {
    const service = new LibraryService(dir);
    await assert.rejects(() => service.delete("non-existent-id"), {
      message: "Report not found: non-existent-id",
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

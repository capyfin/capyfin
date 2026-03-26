import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AutomationService } from "./service.ts";

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "automation-test-"));
}

const sampleRequest = {
  cardId: "morning-brief",
  cardTitle: "Morning Brief",
  schedule: {
    time: "08:00",
    days: ["monday", "wednesday", "friday"] as (
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday"
    )[],
    timezone: "America/New_York",
  },
  destination: "library" as const,
  enabled: true,
};

void test("list returns empty array when no file exists", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    const items = await service.list();
    assert.deepEqual(items, []);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("create generates id and timestamps, returns automation", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    const before = new Date().toISOString();
    const automation = await service.create(sampleRequest);
    const after = new Date().toISOString();
    assert.ok(automation.id);
    assert.equal(automation.cardId, "morning-brief");
    assert.equal(automation.cardTitle, "Morning Brief");
    assert.equal(automation.destination, "library");
    assert.equal(automation.enabled, true);
    assert.equal(automation.lastRunAt, null);
    assert.equal(automation.lastRunStatus, null);
    assert.ok(automation.createdAt >= before && automation.createdAt <= after);
    assert.ok(automation.updatedAt >= before && automation.updatedAt <= after);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("create with filters stores them correctly", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    const automation = await service.create({
      ...sampleRequest,
      filters: { watchlistOnly: true, sectorFocus: ["tech", "healthcare"] },
    });
    assert.deepEqual(automation.filters, {
      watchlistOnly: true,
      sectorFocus: ["tech", "healthcare"],
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("get returns existing automation by id", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    const created = await service.create(sampleRequest);
    const fetched = await service.get(created.id);
    assert.deepEqual(fetched, created);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("get throws for non-existent id", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    await assert.rejects(() => service.get("non-existent"), {
      message: "Automation not found: non-existent",
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("list returns all created automations", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    await service.create(sampleRequest);
    await service.create({
      ...sampleRequest,
      cardId: "market-health",
      cardTitle: "Market Health",
    });
    const items = await service.list();
    assert.equal(items.length, 2);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("update modifies existing automation fields", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    const created = await service.create(sampleRequest);
    const updated = await service.update(created.id, {
      enabled: false,
      destination: "telegram",
    });
    assert.equal(updated.enabled, false);
    assert.equal(updated.destination, "telegram");
    assert.equal(updated.cardId, "morning-brief");
    assert.ok(updated.updatedAt >= created.updatedAt);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("update throws for non-existent id", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    await assert.rejects(
      () => service.update("non-existent", { enabled: false }),
      { message: "Automation not found: non-existent" },
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("delete removes automation", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    const created = await service.create(sampleRequest);
    const result = await service.delete(created.id);
    assert.deepEqual(result, { deleted: true });
    const items = await service.list();
    assert.equal(items.length, 0);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("delete throws for non-existent id", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    await assert.rejects(() => service.delete("non-existent"), {
      message: "Automation not found: non-existent",
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("delete also removes associated runs", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    const created = await service.create(sampleRequest);
    await service.addRun(created.id, {
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "success",
      duration: 1200,
      outputReportId: "report-1",
    });
    await service.delete(created.id);
    const runs = await service.listRuns(created.id);
    assert.equal(runs.length, 0);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("addRun creates a run with generated id", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    const created = await service.create(sampleRequest);
    const run = await service.addRun(created.id, {
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: "running",
      duration: null,
      outputReportId: null,
    });
    assert.ok(run.id);
    assert.equal(run.automationId, created.id);
    assert.equal(run.status, "running");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("addRun throws for non-existent automation", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    await assert.rejects(
      () =>
        service.addRun("non-existent", {
          startedAt: new Date().toISOString(),
          completedAt: null,
          status: "running",
          duration: null,
          outputReportId: null,
        }),
      { message: "Automation not found: non-existent" },
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("listRuns returns runs for specific automation", async () => {
  const dir = await createTempDir();
  try {
    const service = new AutomationService(dir);
    const auto1 = await service.create(sampleRequest);
    const auto2 = await service.create({
      ...sampleRequest,
      cardId: "market-health",
      cardTitle: "Market Health",
    });
    await service.addRun(auto1.id, {
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "success",
      duration: 500,
      outputReportId: null,
    });
    await service.addRun(auto2.id, {
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "failure",
      duration: 300,
      outputReportId: null,
    });
    const runs1 = await service.listRuns(auto1.id);
    assert.equal(runs1.length, 1);
    assert.equal(runs1[0]?.status, "success");
    const runs2 = await service.listRuns(auto2.id);
    assert.equal(runs2.length, 1);
    assert.equal(runs2[0]?.status, "failure");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("data persists across service instances", async () => {
  const dir = await createTempDir();
  try {
    const service1 = new AutomationService(dir);
    const created = await service1.create(sampleRequest);
    await service1.addRun(created.id, {
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "success",
      duration: 1000,
      outputReportId: null,
    });

    const service2 = new AutomationService(dir);
    const items = await service2.list();
    assert.equal(items.length, 1);
    assert.equal(items[0]?.cardId, "morning-brief");

    const runs = await service2.listRuns(created.id);
    assert.equal(runs.length, 1);
  } finally {
    await rm(dir, { recursive: true });
  }
});

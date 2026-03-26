import assert from "node:assert/strict";
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PreferencesService } from "./service.ts";

function createTempDir(): string {
  return join(tmpdir(), `capyfin-test-${randomUUID()}`);
}

void test("get returns default preferences when no file exists", async () => {
  const stateDir = createTempDir();
  await mkdir(stateDir, { recursive: true });

  try {
    const service = new PreferencesService(stateDir);
    const result = await service.get();

    assert.equal(result.investmentStyle, null);
    assert.equal(result.timeHorizon, null);
    assert.equal(result.riskTolerance, null);
    assert.deepEqual(result.favoriteSectors, []);
    assert.equal(result.preferredMarketFocus, null);
    assert.equal(result.reportDensity, null);
    assert.equal(result.developerMode, false);
    assert.equal(result.traceVisibility, false);
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

void test("update merges partial updates with existing preferences", async () => {
  const stateDir = createTempDir();
  await mkdir(stateDir, { recursive: true });

  try {
    const service = new PreferencesService(stateDir);
    const result = await service.update({
      investmentStyle: "growth",
      riskTolerance: "aggressive",
    });

    assert.equal(result.investmentStyle, "growth");
    assert.equal(result.riskTolerance, "aggressive");
    assert.equal(result.timeHorizon, null);
    assert.equal(result.developerMode, false);
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

void test("update persists preferences to disk", async () => {
  const stateDir = createTempDir();
  await mkdir(stateDir, { recursive: true });

  try {
    const service = new PreferencesService(stateDir);
    await service.update({ developerMode: true });

    const raw = await readFile(join(stateDir, "preferences.json"), "utf-8");
    const stored = JSON.parse(raw) as {
      version: number;
      preferences: Record<string, unknown>;
    };
    assert.equal(stored.version, 1);
    assert.equal(stored.preferences.developerMode, true);
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

void test("get returns previously saved preferences", async () => {
  const stateDir = createTempDir();
  await mkdir(stateDir, { recursive: true });

  try {
    const service = new PreferencesService(stateDir);
    await service.update({
      investmentStyle: "value",
      favoriteSectors: ["Technology", "Healthcare"],
      traceVisibility: true,
    });

    const result = await service.get();
    assert.equal(result.investmentStyle, "value");
    assert.deepEqual(result.favoriteSectors, ["Technology", "Healthcare"]);
    assert.equal(result.traceVisibility, true);
    assert.equal(result.developerMode, false);
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

void test("update overwrites specific fields without losing others", async () => {
  const stateDir = createTempDir();
  await mkdir(stateDir, { recursive: true });

  try {
    const service = new PreferencesService(stateDir);
    await service.update({
      investmentStyle: "growth",
      riskTolerance: "moderate",
    });
    await service.update({ riskTolerance: "aggressive" });

    const result = await service.get();
    assert.equal(result.investmentStyle, "growth");
    assert.equal(result.riskTolerance, "aggressive");
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

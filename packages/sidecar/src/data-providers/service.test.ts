import assert from "node:assert/strict";
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { DataProviderService } from "./service.ts";

function createTempDir(): string {
  return join(tmpdir(), `capyfin-test-${randomUUID()}`);
}

void test("getAll returns all registry providers with disconnected status when no keys stored", async () => {
  const stateDir = createTempDir();
  await mkdir(stateDir, { recursive: true });

  try {
    const service = new DataProviderService(stateDir);
    const result = await service.getAll();

    assert.equal(result.providers.length, 2);
    const fmp = result.providers.find((p) => p.id === "fmp");
    const fred = result.providers.find((p) => p.id === "fred");

    assert.ok(fmp);
    assert.equal(fmp.name, "FMP");
    assert.equal(fmp.connected, false);
    assert.equal(fmp.connectedAt, undefined);

    assert.ok(fred);
    assert.equal(fred.name, "FRED");
    assert.equal(fred.connected, false);
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

void test("saveKey stores a key and marks provider as connected", async () => {
  const stateDir = createTempDir();
  await mkdir(stateDir, { recursive: true });

  try {
    const service = new DataProviderService(stateDir);
    const result = await service.saveKey("fmp", "test-api-key-123");

    assert.equal(result.id, "fmp");
    assert.equal(result.connected, true);
    assert.ok(result.connectedAt);

    // Verify persisted to disk
    const raw = await readFile(join(stateDir, "data-providers.json"), "utf-8");
    const store = JSON.parse(raw) as { version: number; providers: Record<string, unknown> };
    assert.equal(store.version, 1);
    assert.ok(store.providers.fmp);
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

void test("saveKey rejects unknown provider", async () => {
  const stateDir = createTempDir();
  await mkdir(stateDir, { recursive: true });

  try {
    const service = new DataProviderService(stateDir);
    await assert.rejects(
      () => service.saveKey("unknown-provider", "key"),
      { message: 'Unknown data provider: "unknown-provider".' },
    );
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

void test("deleteKey removes a stored key", async () => {
  const stateDir = createTempDir();
  await mkdir(stateDir, { recursive: true });

  try {
    const service = new DataProviderService(stateDir);
    await service.saveKey("fmp", "test-key");

    await service.deleteKey("fmp");

    const result = await service.getAll();
    const fmp = result.providers.find((p) => p.id === "fmp");
    assert.ok(fmp);
    assert.equal(fmp.connected, false);
    assert.equal(fmp.connectedAt, undefined);
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

void test("getAll reflects connected status after saveKey", async () => {
  const stateDir = createTempDir();
  await mkdir(stateDir, { recursive: true });

  try {
    const service = new DataProviderService(stateDir);
    await service.saveKey("fred", "my-fred-key");

    const result = await service.getAll();
    const fred = result.providers.find((p) => p.id === "fred");
    assert.ok(fred);
    assert.equal(fred.connected, true);
    assert.ok(fred.connectedAt);

    const fmp = result.providers.find((p) => p.id === "fmp");
    assert.ok(fmp);
    assert.equal(fmp.connected, false);
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

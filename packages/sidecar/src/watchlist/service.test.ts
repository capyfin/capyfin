import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { WatchlistService } from "./service.ts";

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "watchlist-test-"));
}

void test("getAll returns empty array when no file exists", async () => {
  const dir = await createTempDir();
  try {
    const service = new WatchlistService(dir);
    const items = await service.getAll();
    assert.deepEqual(items, []);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("add creates item with correct fields and server-generated addedAt", async () => {
  const dir = await createTempDir();
  try {
    const service = new WatchlistService(dir);
    const before = new Date().toISOString();
    const item = await service.add({
      ticker: "AAPL",
      list: "watching",
      note: "Strong earnings",
    });
    const after = new Date().toISOString();
    assert.equal(item.ticker, "AAPL");
    assert.equal(item.list, "watching");
    assert.equal(item.note, "Strong earnings");
    assert.ok(item.addedAt >= before && item.addedAt <= after);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("add normalizes ticker to uppercase", async () => {
  const dir = await createTempDir();
  try {
    const service = new WatchlistService(dir);
    const item = await service.add({ ticker: "msft", list: "position" });
    assert.equal(item.ticker, "MSFT");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("add rejects duplicate ticker", async () => {
  const dir = await createTempDir();
  try {
    const service = new WatchlistService(dir);
    await service.add({ ticker: "AAPL", list: "watching" });
    await assert.rejects(
      () => service.add({ ticker: "aapl", list: "position" }),
      {
        message: "Ticker already exists: AAPL",
      },
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("update modifies existing item fields", async () => {
  const dir = await createTempDir();
  try {
    const service = new WatchlistService(dir);
    await service.add({ ticker: "AAPL", list: "watching" });
    const updated = await service.update("AAPL", {
      list: "position",
      note: "Upgraded",
      tags: ["tech"],
    });
    assert.equal(updated.list, "position");
    assert.equal(updated.note, "Upgraded");
    assert.deepEqual(updated.tags, ["tech"]);
    assert.equal(updated.ticker, "AAPL");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("update throws for non-existent ticker", async () => {
  const dir = await createTempDir();
  try {
    const service = new WatchlistService(dir);
    await assert.rejects(() => service.update("AAPL", { note: "test" }), {
      message: "Ticker not found: AAPL",
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("remove deletes an item", async () => {
  const dir = await createTempDir();
  try {
    const service = new WatchlistService(dir);
    await service.add({ ticker: "AAPL", list: "watching" });
    const result = await service.remove("AAPL");
    assert.deepEqual(result, { deleted: true });
    const items = await service.getAll();
    assert.equal(items.length, 0);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("remove throws for non-existent ticker", async () => {
  const dir = await createTempDir();
  try {
    const service = new WatchlistService(dir);
    await assert.rejects(() => service.remove("AAPL"), {
      message: "Ticker not found: AAPL",
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("data persists across service instances", async () => {
  const dir = await createTempDir();
  try {
    const service1 = new WatchlistService(dir);
    await service1.add({ ticker: "AAPL", list: "watching" });
    await service1.add({ ticker: "MSFT", list: "position" });

    const service2 = new WatchlistService(dir);
    const items = await service2.getAll();
    assert.equal(items.length, 2);
    assert.ok(items.some((i) => i.ticker === "AAPL"));
    assert.ok(items.some((i) => i.ticker === "MSFT"));
  } finally {
    await rm(dir, { recursive: true });
  }
});

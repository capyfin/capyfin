import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DeliveryChannelService } from "./service.ts";

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "delivery-channel-test-"));
}

const sampleRequest = {
  type: "telegram" as const,
  label: "My Telegram",
  config: { botToken: "abc123", chatId: "12345" },
};

void test("list returns empty array when no file exists", async () => {
  const dir = await createTempDir();
  try {
    const service = new DeliveryChannelService(dir);
    const channels = await service.list();
    assert.deepEqual(channels, []);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("connect creates channel with generated id and timestamps", async () => {
  const dir = await createTempDir();
  try {
    const service = new DeliveryChannelService(dir);
    const before = new Date().toISOString();
    const channel = await service.connect(sampleRequest);
    const after = new Date().toISOString();
    assert.ok(channel.id);
    assert.equal(channel.type, "telegram");
    assert.equal(channel.label, "My Telegram");
    assert.deepEqual(channel.config, {
      botToken: "abc123",
      chatId: "12345",
    });
    assert.equal(channel.status, "connected");
    assert.ok(channel.connectedAt >= before && channel.connectedAt <= after);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("list returns all connected channels", async () => {
  const dir = await createTempDir();
  try {
    const service = new DeliveryChannelService(dir);
    await service.connect(sampleRequest);
    await service.connect({
      type: "discord",
      label: "My Discord",
      config: { webhookUrl: "https://discord.com/webhook" },
    });
    const channels = await service.list();
    assert.equal(channels.length, 2);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("disconnect removes channel", async () => {
  const dir = await createTempDir();
  try {
    const service = new DeliveryChannelService(dir);
    const channel = await service.connect(sampleRequest);
    const result = await service.disconnect(channel.id);
    assert.deepEqual(result, { deleted: true });
    const channels = await service.list();
    assert.equal(channels.length, 0);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("disconnect throws for non-existent id", async () => {
  const dir = await createTempDir();
  try {
    const service = new DeliveryChannelService(dir);
    await assert.rejects(() => service.disconnect("non-existent"), {
      message: "Channel not found: non-existent",
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("test returns stub success for existing channel", async () => {
  const dir = await createTempDir();
  try {
    const service = new DeliveryChannelService(dir);
    const channel = await service.connect(sampleRequest);
    const result = await service.test(channel.id);
    assert.equal(result.success, true);
    assert.ok(result.message.length > 0);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("test throws for non-existent id", async () => {
  const dir = await createTempDir();
  try {
    const service = new DeliveryChannelService(dir);
    await assert.rejects(() => service.test("non-existent"), {
      message: "Channel not found: non-existent",
    });
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("data persists across service instances", async () => {
  const dir = await createTempDir();
  try {
    const service1 = new DeliveryChannelService(dir);
    await service1.connect(sampleRequest);
    await service1.connect({
      type: "slack",
      label: "My Slack",
      config: { webhookUrl: "https://hooks.slack.com/test" },
    });

    const service2 = new DeliveryChannelService(dir);
    const channels = await service2.list();
    assert.equal(channels.length, 2);
    assert.ok(channels.some((c) => c.type === "telegram"));
    assert.ok(channels.some((c) => c.type === "slack"));
  } finally {
    await rm(dir, { recursive: true });
  }
});

import assert from "node:assert/strict";
import test from "node:test";

// ---------------------------------------------------------------------------
// Component exports
// ---------------------------------------------------------------------------

void test("DeliveryChannelsTab exports a function component", async () => {
  const mod = await import("./components/DeliveryChannelsTab");
  assert.equal(typeof mod.DeliveryChannelsTab, "function");
});

void test("ChannelCard exports a function component", async () => {
  const mod = await import("./components/ChannelCard");
  assert.equal(typeof mod.ChannelCard, "function");
});

void test("ChannelConnectForm exports a function component", async () => {
  const mod = await import("./components/ChannelConnectForm");
  assert.equal(typeof mod.ChannelConnectForm, "function");
});

// ---------------------------------------------------------------------------
// Channel config definitions
// ---------------------------------------------------------------------------

void test("ChannelConnectForm exports CHANNEL_CONFIGS with all 4 channel types", async () => {
  const mod = await import("./components/ChannelConnectForm");
  assert.ok("CHANNEL_CONFIGS" in mod);
  const configs = mod.CHANNEL_CONFIGS as Record<string, unknown>;
  assert.ok("telegram" in configs);
  assert.ok("discord" in configs);
  assert.ok("slack" in configs);
  assert.ok("email" in configs);
});

void test("Telegram config has botToken and chatId fields", async () => {
  const { CHANNEL_CONFIGS } = await import("./components/ChannelConnectForm");
  const telegramFields = CHANNEL_CONFIGS.telegram.fields;
  assert.equal(telegramFields.length, 2);
  const field0 = telegramFields[0];
  const field1 = telegramFields[1];
  assert.ok(field0 && field1);
  assert.equal(field0.key, "botToken");
  assert.equal(field0.label, "Bot Token");
  assert.equal(field1.key, "chatId");
  assert.equal(field1.label, "Chat ID");
});

void test("Discord config has webhookUrl field", async () => {
  const { CHANNEL_CONFIGS } = await import("./components/ChannelConnectForm");
  const discordFields = CHANNEL_CONFIGS.discord.fields;
  assert.equal(discordFields.length, 1);
  const field0 = discordFields[0];
  assert.ok(field0);
  assert.equal(field0.key, "webhookUrl");
  assert.equal(field0.label, "Webhook URL");
});

void test("Slack config has webhookUrl field", async () => {
  const { CHANNEL_CONFIGS } = await import("./components/ChannelConnectForm");
  const slackFields = CHANNEL_CONFIGS.slack.fields;
  assert.equal(slackFields.length, 1);
  const field0 = slackFields[0];
  assert.ok(field0);
  assert.equal(field0.key, "webhookUrl");
  assert.equal(field0.label, "Webhook URL");
});

void test("Email config has address field", async () => {
  const { CHANNEL_CONFIGS } = await import("./components/ChannelConnectForm");
  const emailFields = CHANNEL_CONFIGS.email.fields;
  assert.equal(emailFields.length, 1);
  const field0 = emailFields[0];
  assert.ok(field0);
  assert.equal(field0.key, "address");
  assert.equal(field0.label, "Email Address");
});

// ---------------------------------------------------------------------------
// ChannelCard exports CHANNEL_DEFINITIONS
// ---------------------------------------------------------------------------

void test("ChannelCard exports CHANNEL_DEFINITIONS with 4 channels (no WhatsApp)", async () => {
  const mod = await import("./components/ChannelCard");
  assert.ok("CHANNEL_DEFINITIONS" in mod);
  const defs = mod.CHANNEL_DEFINITIONS as { type: string; label: string }[];
  assert.equal(defs.length, 4);
  const types = defs.map((d) => d.type);
  assert.ok(types.includes("telegram"));
  assert.ok(types.includes("discord"));
  assert.ok(types.includes("slack"));
  assert.ok(types.includes("email"));
  assert.ok(!types.includes("whatsapp"), "WhatsApp should not be included");
});

void test("Each channel definition has type, label, and icon", async () => {
  const mod = await import("./components/ChannelCard");
  const defs = mod.CHANNEL_DEFINITIONS as {
    type: string;
    label: string;
    icon: unknown;
  }[];
  for (const def of defs) {
    assert.ok(def.type, `Missing type for channel`);
    assert.ok(def.label, `Missing label for ${def.type}`);
    assert.ok(def.icon, `Missing icon for ${def.type}`);
  }
});

// ---------------------------------------------------------------------------
// Contract types integration
// ---------------------------------------------------------------------------

void test("DeliveryChannel contract types are available", async () => {
  const contracts = await import("@capyfin/contracts");
  assert.ok("deliveryChannelSchema" in contracts);
  assert.ok("deliveryChannelListSchema" in contracts);
  assert.ok("connectChannelRequestSchema" in contracts);
  assert.ok("disconnectChannelResponseSchema" in contracts);
  assert.ok("testChannelResponseSchema" in contracts);
});

void test("SidecarClient has delivery channel methods", async () => {
  const { SidecarClient } = await import("@/lib/sidecar/client");
  assert.equal(typeof SidecarClient.prototype.listDeliveryChannels, "function");
  assert.equal(
    typeof SidecarClient.prototype.connectDeliveryChannel,
    "function",
  );
  assert.equal(
    typeof SidecarClient.prototype.disconnectDeliveryChannel,
    "function",
  );
  assert.equal(typeof SidecarClient.prototype.testDeliveryChannel, "function");
});

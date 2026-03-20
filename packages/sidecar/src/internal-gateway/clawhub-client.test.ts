import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { mock } from "node:test";
import { ClawHubClient } from "./clawhub-client.ts";

const MOCK_SKILLS = [
  {
    id: "crypto-tracker",
    name: "Crypto Tracker",
    description: "Track cryptocurrency prices and trends.",
    version: "1.0.0",
    downloadUrl: "https://registry.clawhub.dev/v1/skills/crypto-tracker/download",
  },
  {
    id: "forex-monitor",
    name: "Forex Monitor",
    description: "Monitor foreign exchange rates.",
    version: "0.2.0",
    downloadUrl: "https://registry.clawhub.dev/v1/skills/forex-monitor/download",
  },
];

const MOCK_SKILL_CONTENT = `---
name: Crypto Tracker
description: Track cryptocurrency prices and trends.
version: 1.0.0
---

# Crypto Tracker

You are a crypto tracking assistant.
`;

void test("listSkills returns skills from registry", async () => {
  const fetchMock = mock.fn(() =>
    Promise.resolve(new Response(JSON.stringify({ skills: MOCK_SKILLS }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })),
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchMock as typeof fetch;

  try {
    const client = new ClawHubClient({
      registryUrl: "https://registry.clawhub.dev/v1",
    });
    const skills = await client.listSkills();

    assert.equal(skills.length, 2);
    assert.equal(skills[0]?.id, "crypto-tracker");
    assert.equal(skills[1]?.id, "forex-monitor");
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("listSkills throws on non-OK response", async () => {
  const fetchMock = mock.fn(() =>
    Promise.resolve(new Response("Internal Server Error", { status: 500 })),
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchMock as typeof fetch;

  try {
    const client = new ClawHubClient({
      registryUrl: "https://registry.clawhub.dev/v1",
    });

    await assert.rejects(
      () => client.listSkills(),
      (error: Error) => {
        assert.ok(error.message.includes("500"));
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("downloadSkill writes SKILL.md to target directory", async () => {
  const targetDir = await mkdtemp(join(tmpdir(), "clawhub-test-"));

  const fetchMock = mock.fn(() =>
    Promise.resolve(new Response(MOCK_SKILL_CONTENT, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })),
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchMock as typeof fetch;

  try {
    const client = new ClawHubClient({
      registryUrl: "https://registry.clawhub.dev/v1",
    });
    const skill = MOCK_SKILLS[0];
    assert.ok(skill);
    const skillDir = await client.downloadSkill(skill, targetDir);

    assert.ok(skillDir.includes("crypto-tracker"));

    const content = await readFile(join(skillDir, "SKILL.md"), "utf8");
    assert.ok(content.includes("Crypto Tracker"));
  } finally {
    globalThis.fetch = originalFetch;
    await rm(targetDir, { recursive: true, force: true });
  }
});

void test("downloadSkill throws on non-OK response", async () => {
  const targetDir = await mkdtemp(join(tmpdir(), "clawhub-test-"));

  const fetchMock = mock.fn(() =>
    Promise.resolve(new Response("Not Found", { status: 404 })),
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchMock as typeof fetch;

  try {
    const client = new ClawHubClient({
      registryUrl: "https://registry.clawhub.dev/v1",
    });
    const skill = MOCK_SKILLS[0];
    assert.ok(skill);

    await assert.rejects(
      () => client.downloadSkill(skill, targetDir),
      (error: Error) => {
        assert.ok(error.message.includes("404"));
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    await rm(targetDir, { recursive: true, force: true });
  }
});

void test("downloadSkillById finds and downloads the correct skill", async () => {
  const targetDir = await mkdtemp(join(tmpdir(), "clawhub-test-"));
  let callIndex = 0;

  const fetchMock = mock.fn(() => {
    callIndex++;
    if (callIndex === 1) {
      // listSkills call
      return Promise.resolve(new Response(JSON.stringify({ skills: MOCK_SKILLS }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));
    }
    // downloadSkill call
    return Promise.resolve(new Response(MOCK_SKILL_CONTENT, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    }));
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchMock as typeof fetch;

  try {
    const client = new ClawHubClient({
      registryUrl: "https://registry.clawhub.dev/v1",
    });
    const skillDir = await client.downloadSkillById("crypto-tracker", targetDir);

    assert.ok(skillDir.includes("crypto-tracker"));
    assert.equal(fetchMock.mock.callCount(), 2);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(targetDir, { recursive: true, force: true });
  }
});

void test("downloadSkillById throws when skill not found", async () => {
  const targetDir = await mkdtemp(join(tmpdir(), "clawhub-test-"));

  const fetchMock = mock.fn(() =>
    Promise.resolve(new Response(JSON.stringify({ skills: MOCK_SKILLS }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })),
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchMock as typeof fetch;

  try {
    const client = new ClawHubClient({
      registryUrl: "https://registry.clawhub.dev/v1",
    });

    await assert.rejects(
      () => client.downloadSkillById("nonexistent-skill", targetDir),
      (error: Error) => {
        assert.ok(error.message.includes("nonexistent-skill"));
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    await rm(targetDir, { recursive: true, force: true });
  }
});

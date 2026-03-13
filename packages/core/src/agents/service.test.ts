import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { AgentService } from "./service.ts";

async function createStorePath(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), `${prefix}-`));
  return join(directory, "catalog.json");
}

void test("agent service manages catalog lifecycle and creates session transcripts", async (context) => {
  const storePath = await createStorePath("capyfin-agents");
  const service = new AgentService({ storePath });

  context.after(async () => {
    await rm(dirname(storePath), { force: true, recursive: true });
  });

  const initialCatalog = await service.getCatalog();
  assert.equal(initialCatalog.defaultAgentId, "main");
  assert.ok(initialCatalog.agents.some((agent) => agent.id === "main"));

  const analyst = await service.createAgent({
    name: "Analyst",
    description: "Research-oriented finance agent.",
    providerId: "openai",
    modelId: "gpt-5",
    setAsDefault: true,
  });

  assert.equal(analyst.id, "analyst");
  assert.equal(analyst.isDefault, true);

  const updated = await service.updateAgent("analyst", {
    instructions: "Focus on portfolio research and planning.",
  });
  assert.match(updated.instructions, /portfolio research/i);

  const session = await service.createSession({
    agentId: "analyst",
    initialPrompt: "Review my allocation drift.",
    label: "Allocation review",
  });

  assert.equal(session.agentId, "analyst");
  assert.match(session.sessionKey, /^agent:analyst:session:/);
  await access(session.sessionFile);
  const transcript = await readFile(session.sessionFile, "utf8");
  assert.match(transcript, /Allocation review/);
  assert.match(transcript, /Review my allocation drift\./);

  const sessions = await service.listSessions("analyst");
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0]?.id, session.id);

  const deleted = await service.deleteAgent("analyst");
  assert.equal(deleted.agentId, "analyst");
  assert.equal(deleted.deletedSessions, 1);

  await assert.rejects(
    () => service.deleteAgent("main"),
    /cannot be deleted/i,
  );
});

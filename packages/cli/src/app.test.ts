import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runCli } from "./app.ts";
import type { CliIo } from "./io.ts";

class MemoryCliIo implements CliIo {
  readonly #prompts: string[];
  readonly #stdoutMessages: string[] = [];
  readonly #stderrMessages: string[] = [];
  readonly isInteractive = true;

  constructor(prompts: string[] = []) {
    this.#prompts = [...prompts];
  }

  get stdoutMessages(): readonly string[] {
    return this.#stdoutMessages;
  }

  get stderrMessages(): readonly string[] {
    return this.#stderrMessages;
  }

  prompt(): Promise<string> {
    return Promise.resolve(this.#prompts.shift() ?? "");
  }

  promptSecret(): Promise<string> {
    return Promise.resolve(this.#prompts.shift() ?? "");
  }

  stderr(message: string): void {
    this.#stderrMessages.push(message);
  }

  stdout(message: string): void {
    this.#stdoutMessages.push(message);
  }
}

async function createStorePath(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), `${prefix}-`));
  return join(directory, "auth-profiles.json");
}

void test("auth login stores and selects a provider profile", async (context) => {
  const storePath = await createStorePath("capyfin-cli");
  const io = new MemoryCliIo();

  context.after(async () => {
    await rm(dirname(storePath), { force: true, recursive: true });
  });

  const exitCode = await runCli(
    ["auth", "login", "openai", "--api-key", "sk-test"],
    { io, storePath },
  );

  assert.equal(exitCode, 0);
  assert.match(io.stdoutMessages.join(""), /Stored profile openai:default/);

  const statusIo = new MemoryCliIo();
  const statusExitCode = await runCli(
    ["auth", "status", "openai", "--output", "json"],
    { io: statusIo, storePath },
  );

  assert.equal(statusExitCode, 0);
  const parsed = JSON.parse(statusIo.stdoutMessages.join("")) as {
    selectedProfileId?: string;
    resolved?: { source: string };
  };
  assert.equal(parsed.selectedProfileId, "openai:default");
  assert.equal(parsed.resolved?.source, "profile");
});

void test("auth providers emits provider metadata as json", async () => {
  const io = new MemoryCliIo();
  const exitCode = await runCli(["auth", "providers", "--output", "json"], { io });

  assert.equal(exitCode, 0);
  const providers = JSON.parse(io.stdoutMessages.join("")) as { id: string }[];
  assert.ok(providers.some((provider) => provider.id === "openai"));
  assert.ok(providers.some((provider) => provider.id === "anthropic"));
});

void test("agents create and sessions create persist agent state", async (context) => {
  const storePath = await createStorePath("capyfin-cli-agents");
  const io = new MemoryCliIo();

  context.after(async () => {
    await rm(dirname(storePath), { force: true, recursive: true });
  });

  const createExitCode = await runCli(
    ["agents", "create", "--name", "Research", "--provider", "openai", "--model", "gpt-5"],
    { io, storePath },
  );
  assert.equal(createExitCode, 0);
  assert.match(io.stdoutMessages.join(""), /Created agent research/);

  const sessionIo = new MemoryCliIo();
  const sessionExitCode = await runCli(
    ["sessions", "create", "research", "--label", "Morning brief", "--output", "json"],
    { io: sessionIo, storePath },
  );
  assert.equal(sessionExitCode, 0);

  const session = JSON.parse(sessionIo.stdoutMessages.join("")) as {
    agentId: string;
    label?: string;
    sessionKey: string;
  };
  assert.equal(session.agentId, "research");
  assert.equal(session.label, "Morning brief");
  assert.match(session.sessionKey, /^agent:research:session:/);
});

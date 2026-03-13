import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { AgentService } from "@capyfin/core/agents";
import { ProviderAuthService } from "@capyfin/core/auth";
import type { UIMessage } from "ai";
import { AgentChatService } from "./service.ts";

async function createStorePath(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), `${prefix}-`));
  return join(directory, "catalog.json");
}

void test("chat service bootstraps the main agent and persists streamed replies", async (context) => {
  const storePath = await createStorePath("capyfin-chat");
  const authStorePath = join(dirname(storePath), "auth-profiles.json");
  const agentService = new AgentService({ storePath });
  const authService = new ProviderAuthService({ storePath: authStorePath });

  context.after(async () => {
    await rm(dirname(storePath), { force: true, recursive: true });
  });

  await authService.saveSecretProfile({
    providerId: "openai",
    secret: "test-openai-key",
  });

  const service = new AgentChatService({
    agentService,
    authService,
    executeStream() {
      return {
        consumeStream() {
          return Promise.resolve();
        },
        toUIMessageStreamResponse(options) {
          const assistantMessage: UIMessage = {
            id: "assistant-1",
            parts: [
              {
                text: "Main agent response",
                type: "text",
              },
            ],
            role: "assistant",
          };

          void options?.onFinish?.({
            isContinuation: false,
            messages: [...(options.originalMessages ?? []), assistantMessage],
            responseMessage: assistantMessage,
          } as never);

          return new Response("ok", { status: 200 });
        },
      };
    },
  });

  const bootstrap = await service.bootstrapConversation();
  assert.equal(bootstrap.agent.id, "main");
  assert.equal(bootstrap.session.agentId, "main");
  assert.equal(bootstrap.resolvedProviderId, "openai");
  assert.equal(bootstrap.resolvedModelId, "gpt-5");

  const response = await service.streamConversation({
    message: {
      id: "user-1",
      parts: [{ text: "Build a weekly finance plan.", type: "text" }],
      role: "user",
    },
    sessionId: bootstrap.session.id,
  });
  assert.equal(response.status, 200);

  const messages = await waitForSessionMessages(
    agentService,
    bootstrap.session.id,
    2,
  );
  assert.equal(messages.length, 2);
  const userMessage = messages[0];
  const assistantMessage = messages[1];
  assert.ok(userMessage);
  assert.ok(assistantMessage);
  assert.equal(userMessage.role, "user");
  assert.equal(assistantMessage.role, "assistant");
  assert.match(assistantMessage.text, /Main agent response/);
});

async function waitForSessionMessages(
  agentService: AgentService,
  sessionId: string,
  expectedLength: number,
): Promise<Awaited<ReturnType<AgentService["readSessionMessages"]>>> {
  const timeoutAt = Date.now() + 1_000;

  while (Date.now() < timeoutAt) {
    const messages = await agentService.readSessionMessages("main", sessionId);
    if (messages.length >= expectedLength) {
      return messages;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  }

  return agentService.readSessionMessages("main", sessionId);
}

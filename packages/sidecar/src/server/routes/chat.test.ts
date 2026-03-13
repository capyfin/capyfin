import test from "node:test";
import assert from "node:assert/strict";
import { createChatRoutes } from "./chat.ts";

void test("chat routes expose bootstrap and stream endpoints", async () => {
  let streamed = false;
  const app = createChatRoutes(
    {
      authSessions: {} as never,
      config: {
        hostname: "127.0.0.1",
        password: "password",
        port: 3000,
        username: "capyfin",
      },
      createAgentService: (() => {
        throw new Error("unused");
      }) as never,
      createAuthService: (() => {
        throw new Error("unused");
      }) as never,
      startedAt: Date.now(),
      version: "0.1.0-test",
    },
    {
      createChatService: () => ({
        bootstrapConversation() {
          return {
            agent: {
              agentDir: "/tmp/main",
              createdAt: new Date().toISOString(),
              id: "main",
              instructions: "You are Main.",
              isDefault: true,
              name: "Main",
              updatedAt: new Date().toISOString(),
              workspaceDir: "/tmp/main/workspace",
            },
            agents: [
              {
                agentDir: "/tmp/main",
                createdAt: new Date().toISOString(),
                id: "main",
                instructions: "You are Main.",
                isDefault: true,
                name: "Main",
                updatedAt: new Date().toISOString(),
                workspaceDir: "/tmp/main/workspace",
              },
            ],
            messages: [],
            resolvedModelId: "gpt-5",
            resolvedProviderId: "openai",
            session: {
              agentId: "main",
              agentName: "Main",
              createdAt: new Date().toISOString(),
              id: "session-1",
              sessionFile: "/tmp/main/session.jsonl",
              sessionKey: "agent:main:session:session-1",
              updatedAt: new Date().toISOString(),
              workspaceDir: "/tmp/main/workspace",
            },
          };
        },
        streamConversation() {
          streamed = true;
          return new Response("streaming", { status: 200 });
        },
      }),
    },
  );

  const bootstrapResponse = await app.request("/bootstrap");
  assert.equal(bootstrapResponse.status, 200);
  const bootstrap = (await bootstrapResponse.json()) as {
    agent: { id: string };
    resolvedProviderId?: string;
  };
  assert.equal(bootstrap.agent.id, "main");
  assert.equal(bootstrap.resolvedProviderId, "openai");

  const streamResponse = await app.request("/", {
    body: JSON.stringify({
      agentId: "main",
      message: {
        id: "user-1",
        parts: [{ text: "hello", type: "text" }],
        role: "user",
      },
      sessionId: "session-1",
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  assert.equal(streamResponse.status, 200);
  assert.equal(streamed, true);
});

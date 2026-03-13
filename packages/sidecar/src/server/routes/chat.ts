import { chatBootstrapSchema } from "@capyfin/contracts";
import { validateUIMessages } from "ai";
import { Hono } from "hono";
import { z } from "zod";
import { AgentChatService } from "../../chat/service.ts";
import type { SidecarRuntime } from "../context.ts";

const chatRequestSchema = z.object({
  agentId: z.string().min(1).optional(),
  message: z.object({
    id: z.string().min(1),
    parts: z.array(
      z.object({
        text: z.string(),
        type: z.literal("text"),
      }),
    ).min(1),
    role: z.literal("user"),
  }),
  sessionId: z.string().min(1).optional(),
});

interface ChatRouteOptions {
  createChatService?: () => Pick<
    AgentChatService,
    "bootstrapConversation" | "streamConversation"
  >;
}

export function createChatRoutes(
  runtime: SidecarRuntime,
  options: ChatRouteOptions = {},
): Hono {
  const app = new Hono();
  const createChatService =
    options.createChatService ??
    (() =>
      new AgentChatService({
        agentService: runtime.createAgentService(),
        authService: runtime.createAuthService(),
      }));

  app.get("/bootstrap", async (context) => {
    const agentId = context.req.query("agentId")?.trim();
    const bootstrap = await createChatService().bootstrapConversation(agentId);
    return context.json(chatBootstrapSchema.parse(bootstrap));
  });

  app.post("/", async (context) => {
    const payload = chatRequestSchema.parse(await context.req.json());
    const messages = await validateUIMessages({
      messages: [payload.message],
    });
    const message = messages[0];
    if (!message) {
      throw new Error("Chat message cannot be empty.");
    }

    return createChatService().streamConversation({
      ...(payload.agentId ? { agentId: payload.agentId } : {}),
      message,
      ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
    });
  });

  return app;
}

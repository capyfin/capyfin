import {
  agentCatalogSchema,
  agentSchema,
  agentSessionListSchema,
  agentSessionSchema,
  createAgentRequestSchema,
  createAgentSessionRequestSchema,
  deleteAgentResponseSchema,
  updateAgentRequestSchema,
} from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createAgentRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/", async (context) => {
    const catalog = await runtime.createAgentService().getCatalog();
    return context.json(agentCatalogSchema.parse(catalog));
  });

  app.post("/", async (context) => {
    const payload = createAgentRequestSchema.parse(await context.req.json());
    const agent = await runtime.createAgentService().createAgent(payload);
    return context.json(agentSchema.parse(agent), 201);
  });

  app.patch("/:agentId", async (context) => {
    const payload = updateAgentRequestSchema.parse(await context.req.json());
    const agent = await runtime
      .createAgentService()
      .updateAgent(context.req.param("agentId"), payload);
    return context.json(agentSchema.parse(agent));
  });

  app.delete("/:agentId", async (context) => {
    const summary = await runtime
      .createAgentService()
      .deleteAgent(context.req.param("agentId"));
    return context.json(deleteAgentResponseSchema.parse(summary));
  });

  app.get("/sessions", async (context) => {
    const agentId = context.req.query("agentId")?.trim();
    const sessions = await runtime.createAgentService().listSessions(agentId);
    return context.json(
      agentSessionListSchema.parse({
        ...(agentId ? { agentId } : {}),
        sessions,
      }),
    );
  });

  app.post("/sessions", async (context) => {
    const payload = createAgentSessionRequestSchema.parse(await context.req.json());
    const session = await runtime.createAgentService().createSession(payload);
    return context.json(agentSessionSchema.parse(session), 201);
  });

  return app;
}

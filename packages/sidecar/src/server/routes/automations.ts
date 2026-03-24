import {
  automationListSchema,
  automationRunListSchema,
  automationSchema,
  createAutomationRequestSchema,
  deleteAutomationResponseSchema,
  updateAutomationRequestSchema,
} from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createAutomationRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/", async (context) => {
    const automations = await runtime.automationService.list();
    return context.json(automationListSchema.parse({ automations }));
  });

  app.post("/", async (context) => {
    const payload = createAutomationRequestSchema.parse(
      await context.req.json(),
    );
    const automation = await runtime.automationService.create(payload);
    return context.json(automationSchema.parse(automation), 201);
  });

  app.get("/:id", async (context) => {
    const { id } = context.req.param();
    try {
      const automation = await runtime.automationService.get(id);
      return context.json(automationSchema.parse(automation));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Automation not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.put("/:id", async (context) => {
    const { id } = context.req.param();
    const payload = updateAutomationRequestSchema.parse(
      await context.req.json(),
    );
    try {
      const automation = await runtime.automationService.update(id, payload);
      return context.json(automationSchema.parse(automation));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Automation not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.delete("/:id", async (context) => {
    const { id } = context.req.param();
    try {
      const result = await runtime.automationService.delete(id);
      return context.json(deleteAutomationResponseSchema.parse(result));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Automation not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.get("/:id/runs", async (context) => {
    const { id } = context.req.param();
    const runs = await runtime.automationService.listRuns(id);
    return context.json(automationRunListSchema.parse({ runs }));
  });

  return app;
}

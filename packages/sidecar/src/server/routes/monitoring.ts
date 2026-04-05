import {
  attentionItemListSchema,
  attentionItemSchema,
} from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createMonitoringRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/attention-items", async (context) => {
    const urgency = context.req.query("urgency");
    const attentionState = context.req.query("state");
    const filter: { urgency?: string; attentionState?: string } = {};
    if (urgency) filter.urgency = urgency;
    if (attentionState) filter.attentionState = attentionState;
    const items = await runtime.monitoringService.getItems(filter);
    return context.json(attentionItemListSchema.parse(items));
  });

  app.post("/dismiss/:itemId", async (context) => {
    const { itemId } = context.req.param();
    try {
      const item = await runtime.monitoringService.dismissItem(itemId);
      return context.json(attentionItemSchema.parse(item));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Attention item not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.post("/scan", async (context) => {
    await runtime.monitoringService.scan();
    return context.json({ success: true });
  });

  return app;
}

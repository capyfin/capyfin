import {
  connectChannelRequestSchema,
  deliveryChannelListSchema,
  deliveryChannelSchema,
  disconnectChannelResponseSchema,
  testChannelResponseSchema,
} from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createDeliveryChannelRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/", async (context) => {
    const channels = await runtime.deliveryChannelService.list();
    return context.json(deliveryChannelListSchema.parse({ channels }));
  });

  app.post("/", async (context) => {
    const payload = connectChannelRequestSchema.parse(await context.req.json());
    const channel = await runtime.deliveryChannelService.connect(payload);
    return context.json(deliveryChannelSchema.parse(channel), 201);
  });

  app.delete("/:id", async (context) => {
    const { id } = context.req.param();
    try {
      const result = await runtime.deliveryChannelService.disconnect(id);
      return context.json(disconnectChannelResponseSchema.parse(result));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Channel not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.post("/:id/test", async (context) => {
    const { id } = context.req.param();
    try {
      const result = await runtime.deliveryChannelService.test(id);
      return context.json(testChannelResponseSchema.parse(result));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Channel not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  return app;
}

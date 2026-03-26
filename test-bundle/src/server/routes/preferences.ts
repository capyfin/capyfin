import {
  updatePreferencesRequestSchema,
  userPreferencesSchema,
} from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createPreferencesRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/", async (context) => {
    const preferences = await runtime.preferencesService.get();
    return context.json(userPreferencesSchema.parse(preferences));
  });

  app.put("/", async (context) => {
    const payload = updatePreferencesRequestSchema.parse(
      await context.req.json(),
    );
    const updated = await runtime.preferencesService.update(payload);
    return context.json(userPreferencesSchema.parse(updated));
  });

  return app;
}

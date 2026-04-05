import { reviewQueueResponseSchema } from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createReviewQueueRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/", async (context) => {
    const limitParam = context.req.query("limit");
    let limit = 10;
    if (limitParam) {
      const parsed = Number.parseInt(limitParam, 10);
      if (!Number.isNaN(parsed)) {
        limit = Math.max(1, Math.min(parsed, 50));
      }
    }
    const result = await runtime.reviewQueueService.getQueue(limit);
    return context.json(reviewQueueResponseSchema.parse(result));
  });

  return app;
}

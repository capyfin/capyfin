import {
  appManifest,
  sidecarBootstrapSchema,
  sidecarHealthSchema,
} from "@capyfin/contracts";
import type { Context } from "hono";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { SidecarRuntime } from "../context";

export function createGlobalRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/health", (context) => {
    const payload = sidecarHealthSchema.parse({
      healthy: true,
      productName: appManifest.productName,
      version: runtime.version,
    });

    return context.json(payload);
  });

  app.get("/bootstrap", (context) => {
    const payload = sidecarBootstrapSchema.parse({
      manifest: appManifest,
      runtime: {
        auth: "basic",
        mode: "sidecar",
        streams: {
          sse: true,
          websocket: false,
        },
      },
    });

    return context.json(payload);
  });

  app.get("/events", (context) => {
    prepareEventStream(context);

    return streamSSE(context, async (stream) => {
      await stream.writeSSE({
        event: "connected",
        data: JSON.stringify({
          timestamp: new Date(runtime.startedAt).toISOString(),
          type: "sidecar.connected",
        }),
      });

      const heartbeat = setInterval(() => {
        void stream.writeSSE({
          event: "heartbeat",
          data: JSON.stringify({
            timestamp: new Date().toISOString(),
            type: "sidecar.heartbeat",
          }),
        });
      }, 10_000);

      await new Promise<void>((resolve) => {
        stream.onAbort(() => {
          clearInterval(heartbeat);
          resolve();
        });
      });
    });
  });

  return app;
}

function prepareEventStream(context: Context): void {
  context.header("Cache-Control", "no-cache");
  context.header("Connection", "keep-alive");
  context.header("X-Accel-Buffering", "no");
  context.header("X-Content-Type-Options", "nosniff");
}

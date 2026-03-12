import appManifestJson from "../../../config/app-manifest.json" with { type: "json" };
import { z } from "zod";

export const workspaceAreaSchema = z.object({
  path: z.string().min(1),
  responsibility: z.string().min(1),
});

export const appManifestSchema = z.object({
  productName: z.string().min(1),
  workspaceLayout: z.array(workspaceAreaSchema).min(1),
});

export const sidecarConnectionSchema = z.object({
  url: z.url(),
  username: z.string().min(1),
  password: z.string().min(1),
  isSidecar: z.boolean(),
});

export const sidecarHealthSchema = z.object({
  healthy: z.literal(true),
  productName: z.string().min(1),
  version: z.string().min(1),
});

export const sidecarBootstrapSchema = z.object({
  manifest: appManifestSchema,
  runtime: z.object({
    auth: z.literal("basic"),
    mode: z.literal("sidecar"),
    streams: z.object({
      sse: z.boolean(),
      websocket: z.boolean(),
    }),
  }),
  version: z.string().min(1).optional(),
});

export type WorkspaceArea = z.infer<typeof workspaceAreaSchema>;
export type AppManifest = z.infer<typeof appManifestSchema>;
export type SidecarConnection = z.infer<typeof sidecarConnectionSchema>;
export type SidecarHealth = z.infer<typeof sidecarHealthSchema>;
export type SidecarBootstrap = z.infer<typeof sidecarBootstrapSchema>;

export const appManifest = appManifestSchema.parse(appManifestJson);

export function createBasicAuthHeader(
  username: string,
  password: string,
): string {
  if (typeof btoa === "function") {
    return `Basic ${btoa(`${username}:${password}`)}`;
  }

  const nodeBuffer = (
    globalThis as {
      Buffer?: {
        from(
          input: string,
          encoding: string,
        ): { toString(encoding: string): string };
      };
    }
  ).Buffer;

  if (nodeBuffer) {
    return `Basic ${nodeBuffer
      .from(`${username}:${password}`, "utf8")
      .toString("base64")}`;
  }

  throw new Error("No base64 encoder is available in the current runtime.");
}

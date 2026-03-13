import { getAppManifest, renderMetadataText } from "@capyfin/core";
import type { ResolvedRunCliOptions } from "../app.ts";

export function printMetadata(
  output: "text" | "json",
  options: ResolvedRunCliOptions,
): void {
  if (output === "json") {
    options.io.stdout(`${JSON.stringify(getAppManifest(), null, 2)}\n`);
    return;
  }

  options.io.stdout(renderMetadataText());
}

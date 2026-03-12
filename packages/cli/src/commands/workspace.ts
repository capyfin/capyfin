import { getAppManifest, renderWorkspaceText } from "@capyfin/core";
import type { ResolvedRunCliOptions } from "../app";

export function printWorkspace(
  output: "text" | "json",
  options: ResolvedRunCliOptions,
): void {
  if (output === "json") {
    options.io.stdout(
      `${JSON.stringify(getAppManifest().workspaceLayout, null, 2)}\n`,
    );
    return;
  }

  options.io.stdout(renderWorkspaceText());
}

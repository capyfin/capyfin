import type { SidecarConfig } from "../config";

export interface SidecarRuntime {
  config: SidecarConfig;
  startedAt: number;
  version: string;
}

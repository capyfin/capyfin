import { dirname, join } from "node:path";
import { resolveCapyfinConfigDir } from "../config-paths.ts";
import type { AuthStoreLocation } from "./types.ts";

const CONFIG_FILE_NAME = "auth-profiles.json";
const AUTH_BRIDGE_FILE_NAME = "auth.json";

export function resolveAuthStoreLocation(
  env: NodeJS.ProcessEnv = process.env,
): AuthStoreLocation {
  const explicitStorePath = env.CAPYFIN_AUTH_STORE_PATH?.trim();
  if (explicitStorePath) {
    return {
      authBridgePath: join(dirname(explicitStorePath), AUTH_BRIDGE_FILE_NAME),
      configDir: dirname(explicitStorePath),
      authStorePath: explicitStorePath,
    };
  }

  const configDir = resolveCapyfinConfigDir(env);

  return {
    authBridgePath: join(configDir, AUTH_BRIDGE_FILE_NAME),
    configDir,
    authStorePath: join(configDir, CONFIG_FILE_NAME),
  };
}

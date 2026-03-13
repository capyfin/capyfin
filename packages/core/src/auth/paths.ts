import { homedir } from "node:os";
import { dirname, join } from "node:path";
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

  const appDirectoryName = process.platform === "linux" ? "capyfin" : "CapyFin";
  const configRoot =
    env.CAPYFIN_CONFIG_HOME?.trim() ??
    resolvePlatformConfigRoot(env, homedir());
  const configDir = join(configRoot, appDirectoryName);

  return {
    authBridgePath: join(configDir, AUTH_BRIDGE_FILE_NAME),
    configDir,
    authStorePath: join(configDir, CONFIG_FILE_NAME),
  };
}

function resolvePlatformConfigRoot(
  env: NodeJS.ProcessEnv,
  homeDirectory: string,
): string {
  if (process.platform === "darwin") {
    return join(homeDirectory, "Library", "Application Support");
  }

  if (process.platform === "win32") {
    const appData = env.APPDATA?.trim();
    if (appData) {
      return appData;
    }

    return join(homeDirectory, "AppData", "Roaming");
  }

  const xdgConfigHome = env.XDG_CONFIG_HOME?.trim();
  if (xdgConfigHome) {
    return xdgConfigHome;
  }

  return join(homeDirectory, ".config");
}

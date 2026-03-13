import { homedir } from "node:os";
import { join } from "node:path";

export function resolveCapyfinConfigDir(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const appDirectoryName = process.platform === "linux" ? "capyfin" : "CapyFin";
  const configRoot =
    env.CAPYFIN_CONFIG_HOME?.trim() ??
    resolvePlatformConfigRoot(env, homedir());

  return join(configRoot, appDirectoryName);
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

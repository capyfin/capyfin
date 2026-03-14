import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { EmbeddedGatewayPaths } from "./paths.ts";

export async function writeEmbeddedGatewayConfig(params: {
  paths: EmbeddedGatewayPaths;
  port: number;
  token: string;
}): Promise<void> {
  const payload = {
    discovery: {
      mdns: {
        mode: "off",
      },
      wideArea: {
        enabled: false,
      },
    },
    gateway: {
      auth: {
        mode: "token",
        token: params.token,
      },
      bind: "loopback",
      controlUi: {
        enabled: false,
      },
      port: params.port,
    },
    logging: {
      file: join(params.paths.logsDir, "gateway.log"),
      level: "info",
    },
  };

  await writeFile(
    params.paths.configPath,
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
}

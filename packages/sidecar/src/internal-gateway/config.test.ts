import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { writeEmbeddedGatewayConfig } from "./config.ts";

void describe("writeEmbeddedGatewayConfig", () => {
  void it("writes a local-only config with app-owned logging", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "capyfin-gateway-config-"));
    const paths = {
      configDir: rootDir,
      configPath: join(rootDir, "runtime.json"),
      deviceIdentityPath: join(rootDir, "identity", "device.json"),
      logsDir: join(rootDir, "logs"),
      metadataPath: join(rootDir, "metadata.json"),
      oauthDir: join(rootDir, "oauth"),
      rootDir,
      stateDir: join(rootDir, "state"),
      tokenPath: join(rootDir, "gateway-token"),
      workspacesDir: join(rootDir, "workspaces"),
    };

    await writeEmbeddedGatewayConfig({
      paths,
      port: 19111,
      token: "secret-token",
    });

    const raw = await readFile(paths.configPath, "utf8");
    const config = JSON.parse(raw) as {
      discovery: { mdns: { mode: string }; wideArea: { enabled: boolean } };
      gateway: {
        auth: { mode: string; token: string };
        bind: string;
        controlUi: { enabled: boolean };
        port: number;
      };
      logging: { file: string; level: string };
    };

    assert.deepEqual(config.discovery, {
      mdns: { mode: "off" },
      wideArea: { enabled: false },
    });
    assert.deepEqual(config.gateway, {
      auth: { mode: "token", token: "secret-token" },
      bind: "loopback",
      controlUi: { enabled: false },
      port: 19111,
    });
    assert.deepEqual(config.logging, {
      file: join(paths.logsDir, "gateway.log"),
      level: "info",
    });
  });
});

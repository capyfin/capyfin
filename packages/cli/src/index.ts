#!/usr/bin/env node

import {
  getAppManifest,
  renderMetadataText,
  renderWorkspaceText,
} from "@capyfin/core";
import { parseArgs } from "node:util";

type CommandName = "metadata" | "workspace" | "serve";
type OutputFormat = "text" | "json";

async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;
  const { values, positionals } = parseArgs({
    args: normalizedArgv,
    options: {
      output: {
        type: "string",
        default: "text",
      },
      hostname: {
        type: "string",
      },
      port: {
        type: "string",
      },
      password: {
        type: "string",
      },
      username: {
        type: "string",
      },
    },
    allowPositionals: true,
    strict: true,
  });

  const command = (positionals[0] ?? "metadata") as CommandName;
  const output = values.output as OutputFormat;

  switch (command) {
    case "metadata":
      printMetadata(output);
      return;
    case "workspace":
      printWorkspace(output);
      return;
    case "serve":
      await runServe(values);
      return;
    default:
      throw new Error(`Unknown command: ${String(command)}`);
  }
}

function printMetadata(output: OutputFormat): void {
  if (output === "json") {
    console.log(JSON.stringify(getAppManifest(), null, 2));
    return;
  }

  process.stdout.write(renderMetadataText());
}

function printWorkspace(output: OutputFormat): void {
  if (output === "json") {
    console.log(JSON.stringify(getAppManifest().workspaceLayout, null, 2));
    return;
  }

  process.stdout.write(renderWorkspaceText());
}

async function runServe(
  values: Record<string, string | boolean | undefined>,
): Promise<void> {
  const { startSidecarServer } = await import("@capyfin/sidecar");
  const portValue = readStringValue(values.port);
  const port = portValue ? Number.parseInt(portValue, 10) : undefined;
  const password = readStringValue(values.password) ?? process.env.CAPYFIN_SERVER_PASSWORD;

  if (!password) {
    throw new Error("Missing sidecar password. Provide --password or CAPYFIN_SERVER_PASSWORD.");
  }

  if (port === undefined || !Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error("Missing or invalid sidecar port. Provide --port.");
  }

  const server = startSidecarServer({
    hostname: readStringValue(values.hostname) ?? "127.0.0.1",
    password,
    port,
    username: readStringValue(values.username) ?? "capyfin",
  });

  const shutdown = () => {
    server.close();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function readStringValue(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

void main();

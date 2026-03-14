import { parseArgs } from "node:util";
import { runAgentsCommand } from "./commands/agents.ts";
import { runAuthCommand } from "./commands/auth.ts";
import { printMetadata } from "./commands/metadata.ts";
import { runServe } from "./commands/serve.ts";
import { runSessionsCommand } from "./commands/sessions.ts";
import { printWorkspace } from "./commands/workspace.ts";
import { createProcessCliIo, type CliIo } from "./io.ts";

type CommandName =
  | "agents"
  | "auth"
  | "metadata"
  | "serve"
  | "sessions"
  | "workspace";
type OutputFormat = "text" | "json";

export interface RunCliOptions {
  env?: NodeJS.ProcessEnv | undefined;
  io?: CliIo | undefined;
  now?: (() => Date) | undefined;
  storePath?: string | undefined;
}

export interface ResolvedRunCliOptions {
  env: NodeJS.ProcessEnv;
  io: CliIo;
  now?: (() => Date) | undefined;
  storePath?: string | undefined;
}

export async function runCli(
  argv: string[] = process.argv.slice(2),
  options: RunCliOptions = {},
): Promise<number> {
  const io = options.io ?? createProcessCliIo();
  const env = options.env ?? process.env;
  const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;
  const resolvedOptions: ResolvedRunCliOptions = {
    env,
    io,
    ...(options.now ? { now: options.now } : {}),
    ...(options.storePath ? { storePath: options.storePath } : {}),
  };

  try {
    if (
      normalizedArgv.length === 0 ||
      normalizedArgv[0] === "help" ||
      normalizedArgv[0] === "--help" ||
      normalizedArgv[0] === "-h"
    ) {
      io.stdout(renderHelp());
      return 0;
    }

    const command = normalizedArgv[0] as CommandName;
    switch (command) {
      case "metadata":
        handleStaticCommand("metadata", normalizedArgv.slice(1), resolvedOptions);
        return 0;
      case "workspace":
        handleStaticCommand("workspace", normalizedArgv.slice(1), resolvedOptions);
        return 0;
      case "agents":
        await runAgentsCommand(normalizedArgv.slice(1), resolvedOptions);
        return 0;
      case "serve":
        await handleServe(normalizedArgv.slice(1), resolvedOptions);
        return 0;
      case "auth":
        await runAuthCommand(normalizedArgv.slice(1), resolvedOptions);
        return 0;
      case "sessions":
        await runSessionsCommand(normalizedArgv.slice(1), resolvedOptions);
        return 0;
      default:
        throw new Error(`Unknown command: ${String(command)}`);
    }
  } catch (error) {
    io.stderr(`${formatError(error)}\n`);
    return 1;
  }
}

function handleStaticCommand(
  command: "metadata" | "workspace",
  argv: string[],
  options: ResolvedRunCliOptions,
): void {
  const { values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      output: {
        default: "text",
        type: "string",
      },
    },
    strict: true,
  });
  const output = values.output as OutputFormat;

  if (command === "metadata") {
    printMetadata(output, options);
    return;
  }

  printWorkspace(output, options);
}

async function handleServe(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      hostname: {
        type: "string",
      },
      password: {
        type: "string",
      },
      port: {
        type: "string",
      },
      username: {
        type: "string",
      },
    },
    strict: true,
  });

  await runServe(values, options);
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function renderHelp(): string {
  return `Usage: capyfin <command> [options]

Commands:
  metadata [--output text|json]
  workspace [--output text|json]
  serve [--hostname 127.0.0.1] [--port 19111] --password secret [--username capyfin]
  auth providers [--output text|json]
  auth status [provider] [--output text|json]
  auth login [provider] [--api-key value | --token value | --oauth] [--profile label] [--skip-activate]
  auth select <provider|profile-id>
  agents list [--output text|json]
  agents create --name value [--id value] [--description value] [--instructions value] [--provider value] [--model value] [--workspace path] [--default] [--output text|json]
  agents update <agent-id> [--name value] [--description value] [--instructions value] [--provider value] [--model value] [--workspace path] [--default] [--output text|json]
  agents delete <agent-id> [--output text|json]
  sessions list [--agent agent-id] [--output text|json]
  sessions create <agent-id> [--label value] [--prompt value] [--output text|json]
`;
}

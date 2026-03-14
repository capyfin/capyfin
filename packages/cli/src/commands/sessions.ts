import { parseArgs } from "node:util";
import type { AgentSession } from "@capyfin/contracts";
import type { ResolvedRunCliOptions } from "../app.ts";
import { withEmbeddedGatewayContext } from "../runtime.ts";

type OutputFormat = "text" | "json";

export async function runSessionsCommand(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const subcommand = argv[0] ?? "list";

  switch (subcommand) {
    case "list":
      await printSessions(argv.slice(1), options);
      return;
    case "create":
      await createSession(argv.slice(1), options);
      return;
    default:
      throw new Error(`Unknown sessions command: ${subcommand}`);
  }
}

async function printSessions(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      agent: {
        type: "string",
      },
      output: {
        default: "text",
        type: "string",
      },
    },
    strict: true,
  });
  const output = values.output as OutputFormat;
  const sessions = await withEmbeddedGatewayContext(options, async ({ embeddedGateway }) =>
    await embeddedGateway.listSessions(values.agent),
  );

  if (output === "json") {
    options.io.stdout(`${JSON.stringify(sessions, null, 2)}\n`);
    return;
  }

  if (sessions.sessions.length === 0) {
    options.io.stdout("No agent sessions have been created yet.\n");
    return;
  }

  const lines = sessions.sessions.map(renderSession);
  options.io.stdout(`${lines.join("\n\n")}\n`);
}

async function createSession(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      label: {
        type: "string",
      },
      output: {
        default: "text",
        type: "string",
      },
      prompt: {
        type: "string",
      },
    },
    strict: true,
  });
  const output = values.output as OutputFormat;
  const agentId = positionals[0];
  if (!agentId) {
    throw new Error("Agent id is required.");
  }

  const session = await withEmbeddedGatewayContext(options, async ({ embeddedGateway }) =>
    await embeddedGateway.createSession({
      agentId,
      ...(values.label ? { label: values.label } : {}),
      ...(values.prompt ? { initialPrompt: values.prompt } : {}),
    }),
  );

  if (output === "json") {
    options.io.stdout(`${JSON.stringify(session, null, 2)}\n`);
    return;
  }

  options.io.stdout(`${renderSession(session)}\n`);
}

function renderSession(session: AgentSession): string {
  return [
    `${session.agentId}: ${session.label ?? session.id}`,
    `  Session key: ${session.sessionKey}`,
    `  Transcript: ${session.sessionFile}`,
    `  Workspace: ${session.workspaceDir}`,
  ].join("\n");
}

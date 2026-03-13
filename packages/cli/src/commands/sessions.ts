import { parseArgs } from "node:util";
import { AgentService } from "@capyfin/core/agents";
import type { AgentSessionSummary as AgentSession } from "@capyfin/core/agents";
import type { ResolvedRunCliOptions } from "../app.ts";

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
  const sessions = await createAgentService(options).listSessions(values.agent);

  if (output === "json") {
    options.io.stdout(
      `${JSON.stringify(
        {
          ...(values.agent ? { agentId: values.agent } : {}),
          sessions,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  if (sessions.length === 0) {
    options.io.stdout("No agent sessions have been created yet.\n");
    return;
  }

  const lines = sessions.map(renderSession);
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

  const session = await createAgentService(options).createSession({
    agentId,
    ...(values.label ? { label: values.label } : {}),
    ...(values.prompt ? { initialPrompt: values.prompt } : {}),
  });

  if (output === "json") {
    options.io.stdout(`${JSON.stringify(session, null, 2)}\n`);
    return;
  }

  options.io.stdout(`${renderSession(session)}\n`);
}

function createAgentService(options: ResolvedRunCliOptions): AgentService {
  return new AgentService({
    ...(options.now ? { now: options.now } : {}),
    ...(options.storePath ? { storePath: options.storePath } : {}),
  });
}

function renderSession(session: AgentSession): string {
  return [
    `${session.agentId}: ${session.label ?? session.id}`,
    `  Session key: ${session.sessionKey}`,
    `  Transcript: ${session.sessionFile}`,
    `  Workspace: ${session.workspaceDir}`,
  ].join("\n");
}

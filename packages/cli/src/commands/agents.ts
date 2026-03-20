import { parseArgs } from "node:util";
import type { Agent } from "@capyfin/contracts";
import type { ResolvedRunCliOptions } from "../app.ts";
import { withEmbeddedGatewayContext } from "../runtime.ts";

type OutputFormat = "text" | "json";

export async function runAgentsCommand(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const subcommand = argv[0] ?? "list";

  switch (subcommand) {
    case "list":
      await printAgents(argv.slice(1), options);
      return;
    case "create":
      await createAgent(argv.slice(1), options);
      return;
    case "update":
      await updateAgent(argv.slice(1), options);
      return;
    case "delete":
      await deleteAgent(argv.slice(1), options);
      return;
    default:
      throw new Error(`Unknown agents command: ${subcommand}`);
  }
}

async function printAgents(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
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
  const catalog = await withEmbeddedGatewayContext(
    options,
    async ({ embeddedGateway }) => await embeddedGateway.getCatalog(),
  );

  if (output === "json") {
    options.io.stdout(`${JSON.stringify(catalog, null, 2)}\n`);
    return;
  }

  const lines = [`Agent store: ${catalog.storePath}`, ""];
  for (const agent of catalog.agents) {
    lines.push(renderAgent(agent));
  }
  options.io.stdout(`${lines.join("\n")}\n`);
}

async function createAgent(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      default: {
        default: false,
        type: "boolean",
      },
      description: {
        type: "string",
      },
      id: {
        type: "string",
      },
      instructions: {
        type: "string",
      },
      model: {
        type: "string",
      },
      name: {
        type: "string",
      },
      output: {
        default: "text",
        type: "string",
      },
      provider: {
        type: "string",
      },
      workspace: {
        type: "string",
      },
    },
    strict: true,
  });
  const output = values.output as OutputFormat;
  const agent = await withEmbeddedGatewayContext(
    options,
    async ({ embeddedGateway }) =>
      await embeddedGateway.createAgent({
        ...(values.id ? { id: values.id } : {}),
        ...(values.description ? { description: values.description } : {}),
        ...(values.instructions ? { instructions: values.instructions } : {}),
        ...(values.model ? { modelId: values.model } : {}),
        name: requireValue(values.name, "Agent name is required."),
        ...(values.provider ? { providerId: values.provider } : {}),
        ...(values.workspace ? { workspaceDir: values.workspace } : {}),
        ...(values.default ? { setAsDefault: true } : {}),
      }),
  );

  if (output === "json") {
    options.io.stdout(`${JSON.stringify(agent, null, 2)}\n`);
    return;
  }

  options.io.stdout(`Created agent ${agent.id}.\n`);
}

async function updateAgent(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      default: {
        default: false,
        type: "boolean",
      },
      description: {
        type: "string",
      },
      instructions: {
        type: "string",
      },
      model: {
        type: "string",
      },
      name: {
        type: "string",
      },
      output: {
        default: "text",
        type: "string",
      },
      provider: {
        type: "string",
      },
      workspace: {
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

  const agent = await withEmbeddedGatewayContext(
    options,
    async ({ embeddedGateway }) =>
      await embeddedGateway.updateAgent(agentId, {
        ...(values.name ? { name: values.name } : {}),
        ...(values.description ? { description: values.description } : {}),
        ...(values.instructions ? { instructions: values.instructions } : {}),
        ...(values.provider ? { providerId: values.provider } : {}),
        ...(values.model ? { modelId: values.model } : {}),
        ...(values.workspace ? { workspaceDir: values.workspace } : {}),
        ...(values.default ? { setAsDefault: true } : {}),
      }),
  );

  if (output === "json") {
    options.io.stdout(`${JSON.stringify(agent, null, 2)}\n`);
    return;
  }

  options.io.stdout(`Updated agent ${agent.id}.\n`);
}

async function deleteAgent(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const { values, positionals } = parseArgs({
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
  const agentId = positionals[0];
  if (!agentId) {
    throw new Error("Agent id is required.");
  }

  const summary = await withEmbeddedGatewayContext(
    options,
    async ({ embeddedGateway }) => await embeddedGateway.deleteAgent(agentId),
  );
  if (output === "json") {
    options.io.stdout(`${JSON.stringify(summary, null, 2)}\n`);
    return;
  }

  options.io.stdout(
    `Deleted agent ${summary.agentId} and removed ${String(summary.deletedSessions)} sessions.\n`,
  );
}

function renderAgent(agent: Agent): string {
  const lines = [
    `- ${agent.id}${agent.isDefault ? " (default)" : ""}: ${agent.name}`,
    `  Workspace: ${agent.workspaceDir}`,
    `  Agent dir: ${agent.agentDir}`,
  ];

  if (agent.providerId || agent.modelId) {
    lines.push(
      `  Model: ${agent.providerId ?? "unassigned"} / ${agent.modelId ?? "unassigned"}`,
    );
  }

  if (agent.description) {
    lines.push(`  Description: ${agent.description}`);
  }

  return lines.join("\n");
}

function requireValue(value: string | undefined, message: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(message);
  }

  return trimmed;
}

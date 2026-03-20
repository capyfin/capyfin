import { parseArgs } from "node:util";
import type {
  AuthOverview,
  ProviderConnectionInput,
  ProviderDefinition,
  ProviderMethod,
  SavedConnection,
} from "@capyfin/contracts";
import type { CliIo } from "../io.ts";
import type { ResolvedRunCliOptions } from "../app.ts";
import { createCliAuthContext } from "../runtime.ts";

type OutputFormat = "text" | "json";
type AuthStepChoice = "interactive" | "secret";

interface CliPrompterLike {
  confirm(params: {
    initialValue?: boolean;
    message: string;
  }): Promise<boolean>;
  intro(title: string): Promise<void>;
  multiselect<T>(params: {
    initialValues?: T[];
    message: string;
    options: { hint?: string; label: string; value: T }[];
    searchable?: boolean;
  }): Promise<T[]>;
  note(message: string, title?: string): Promise<void>;
  outro(message: string): Promise<void>;
  progress(label: string): {
    stop(message?: string): void;
    update(message: string): void;
  };
  select<T>(params: {
    initialValue?: T;
    message: string;
    options: { hint?: string; label: string; value: T }[];
  }): Promise<T>;
  text(params: {
    initialValue?: string;
    message: string;
    placeholder?: string;
    validate?: (value: string) => string | undefined;
  }): Promise<string>;
}

export async function runAuthCommand(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const subcommand = argv[0] ?? "status";

  switch (subcommand) {
    case "providers":
      await printProviders(argv.slice(1), options);
      return;
    case "status":
      await printStatus(argv.slice(1), options);
      return;
    case "login":
      await login(argv.slice(1), options);
      return;
    case "select":
      await selectConnection(argv.slice(1), options);
      return;
    default:
      throw new Error(`Unknown auth command: ${subcommand}`);
  }
}

async function printProviders(
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
  const { authService } = await createCliAuthContext(options);
  const overview = await authService.getOverview();

  if (output === "json") {
    writeJson(options.io, overview.providers);
    return;
  }

  const lines = ["Available providers:"];
  for (const provider of overview.providers) {
    lines.push(
      `- ${provider.name} (${provider.id}) [${provider.methods.map((method) => method.label).join(", ")}]`,
    );
  }
  options.io.stdout(`${lines.join("\n")}\n`);
}

async function printStatus(
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
  const { authService } = await createCliAuthContext(options);
  const overview = await authService.getOverview();
  const providerSelector = positionals[0]?.trim();

  if (providerSelector) {
    const provider = resolveProvider(overview.providers, providerSelector);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerSelector}`);
    }

    const status = buildProviderStatus(overview, provider);
    if (output === "json") {
      writeJson(options.io, status);
      return;
    }

    options.io.stdout(`${renderProviderStatus(status)}\n`);
    return;
  }

  if (output === "json") {
    writeJson(options.io, overview);
    return;
  }

  const lines = [
    `Config: ${overview.configPath}`,
    `Store: ${overview.storePath}`,
    `Selected provider: ${overview.selectedProviderId ?? "none"}`,
    `Selected profile: ${overview.selectedProfileId ?? "none"}`,
  ];

  if (overview.connections.length === 0) {
    lines.push("", "No provider connections have been configured yet.");
  } else {
    lines.push("", "Current connections:");
    for (const connection of overview.connections) {
      lines.push(renderConnection(connection));
    }
  }

  options.io.stdout(`${lines.join("\n")}\n`);
}

async function login(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      "api-key": {
        type: "string",
      },
      oauth: {
        default: false,
        type: "boolean",
      },
      profile: {
        type: "string",
      },
      "skip-activate": {
        default: false,
        type: "boolean",
      },
      token: {
        type: "string",
      },
    },
    strict: true,
  });
  const io = options.io;
  const { authService } = await createCliAuthContext(options);
  const overview = await authService.getOverview();
  const provider =
    resolveProvider(
      overview.providers,
      positionals[0]?.trim() ??
        (await promptForProviderSelection(overview.providers, io)),
    ) ?? null;

  if (!provider) {
    throw new Error("Provider is required.");
  }

  const explicitApiKey = readStringValue(values["api-key"]);
  const explicitToken = readStringValue(values.token);
  const activate = !values["skip-activate"];
  const previousSelection = activate ? null : overview.selectedProfileId;
  const selectedMethod = await resolveLoginMethod({
    explicitChoice:
      values.oauth || explicitApiKey || explicitToken
        ? "secret"
        : "interactive",
    explicitOauth: values.oauth,
    explicitToken: Boolean(explicitToken),
    provider,
    io,
  });

  let connection: SavedConnection | undefined;
  if (explicitApiKey || explicitToken) {
    connection = await authService.connectSecret({
      authChoice: selectedMethod.id,
      secret: explicitApiKey ?? explicitToken ?? "",
    });
  } else if (
    selectedMethod.input === "api_key" ||
    selectedMethod.input === "token"
  ) {
    const secret = await io.promptSecret(
      `Enter ${provider.name} ${selectedMethod.input === "token" ? "token" : "API key"}: `,
    );
    connection = await authService.connectSecret({
      authChoice: selectedMethod.id,
      secret,
    });
  } else {
    const result = await authService.applyAuthChoice({
      authChoice: selectedMethod.id,
      prompter: createCliPrompter(io),
    });
    connection = result.connection;
  }

  if (!connection) {
    throw new Error(`Connected ${provider.name}, but no profile was stored.`);
  }

  if (
    !activate &&
    previousSelection &&
    previousSelection !== connection.profileId
  ) {
    await authService.selectProfile(previousSelection);
  }

  const profileNote = readStringValue(values.profile);
  const selectionSuffix =
    activate && connection.isDefault ? " and selected it." : ".";
  options.io.stdout(
    `Stored profile ${connection.profileId} for ${provider.name}${profileNote ? ` (${profileNote})` : ""}${selectionSuffix}\n`,
  );
}

async function selectConnection(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const { positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {},
    strict: true,
  });
  const selector = positionals[0]?.trim();

  if (!selector) {
    throw new Error(
      "Missing provider or profile identifier. Usage: capyfin auth select <provider|profile-id>",
    );
  }

  const { authService } = await createCliAuthContext(options);
  const overview = await authService.getOverview();
  const profileId = resolveProfileIdForSelector(overview, selector);

  if (!profileId) {
    throw new Error(`No saved connection matches "${selector}".`);
  }

  const connection = await authService.selectProfile(profileId);
  options.io.stdout(
    `Selected ${connection.providerName}${connection.label ? ` (${connection.label})` : ""}.\n`,
  );
}

async function promptForProviderSelection(
  providers: ProviderDefinition[],
  io: CliIo,
): Promise<string> {
  if (!io.isInteractive) {
    throw new Error("Provider is required in non-interactive mode.");
  }

  io.stdout("Select a provider:\n");
  providers.forEach((provider, index) => {
    io.stdout(
      `${String(index + 1)}. ${provider.name} (${provider.id}) [${provider.methods.map((method) => method.label).join(", ")}]\n`,
    );
  });

  const selection = await io.prompt(
    `Enter a number (1-${String(providers.length)}): `,
  );
  const index = Number.parseInt(selection, 10) - 1;
  const provider = providers[index];
  if (!provider) {
    throw new Error("Invalid provider selection.");
  }

  return provider.id;
}

async function resolveLoginMethod(params: {
  explicitChoice: AuthStepChoice;
  explicitOauth: boolean;
  explicitToken: boolean;
  io: CliIo;
  provider: ProviderDefinition;
}): Promise<ProviderMethod> {
  if (params.explicitOauth) {
    return (
      params.provider.methods.find((method) =>
        isInteractiveInput(method.input),
      ) ?? failMissingMethod(params.provider, "interactive sign-in")
    );
  }

  if (params.explicitToken) {
    return (
      params.provider.methods.find((method) => method.input === "token") ??
      failMissingMethod(params.provider, "token")
    );
  }

  if (params.explicitChoice === "secret") {
    return (
      params.provider.methods.find((method) => method.input === "api_key") ??
      params.provider.methods.find((method) => method.input === "token") ??
      failMissingMethod(params.provider, "secret credential")
    );
  }

  if (params.provider.methods.length === 1) {
    const onlyMethod = params.provider.methods[0];
    if (!onlyMethod) {
      throw new Error(
        `${params.provider.name} does not expose any connection methods.`,
      );
    }
    return onlyMethod;
  }

  if (!params.io.isInteractive) {
    throw new Error(
      `${params.provider.name} supports multiple connection methods. Pass --oauth, --api-key, or --token.`,
    );
  }

  params.io.stdout(`Select a connection method for ${params.provider.name}:\n`);
  params.provider.methods.forEach((method, index) => {
    params.io.stdout(`${String(index + 1)}. ${method.label}\n`);
  });
  const selection = await params.io.prompt(
    `Enter a number (1-${String(params.provider.methods.length)}): `,
  );
  const index = Number.parseInt(selection, 10) - 1;
  const method = params.provider.methods[index];
  if (!method) {
    throw new Error("Invalid connection method selection.");
  }
  return method;
}

function resolveProvider(
  providers: ProviderDefinition[],
  selector: string,
): ProviderDefinition | undefined {
  return providers.find((provider) => provider.id === selector.trim());
}

function buildProviderStatus(
  overview: AuthOverview,
  provider: ProviderDefinition,
): {
  connections: SavedConnection[];
  provider: ProviderDefinition;
  resolved?: {
    source: "profile";
  };
  selectedProfileId?: string;
  selectedConnection?: SavedConnection;
} {
  const providerIds = new Set(
    provider.methods.map((method) => method.providerId),
  );
  providerIds.add(provider.id);

  const connections = overview.connections.filter((connection) =>
    providerIds.has(connection.providerId),
  );
  const selectedConnection =
    connections.find(
      (connection) => connection.profileId === overview.selectedProfileId,
    ) ?? connections.find((connection) => connection.isDefault);

  return {
    connections,
    provider,
    ...(selectedConnection
      ? {
          resolved: {
            source: "profile" as const,
          },
          selectedProfileId: selectedConnection.profileId,
        }
      : {}),
    ...(selectedConnection ? { selectedConnection } : {}),
  };
}

function renderProviderStatus(status: {
  connections: SavedConnection[];
  provider: ProviderDefinition;
  resolved?: {
    source: "profile";
  };
  selectedProfileId?: string;
  selectedConnection?: SavedConnection;
}): string {
  const lines = [
    `${status.provider.name} (${status.provider.id})`,
    `  Methods: ${status.provider.methods.map((method) => method.label).join(", ")}`,
  ];

  if (status.selectedConnection) {
    lines.push(
      `  Selected: ${status.selectedProfileId ?? status.selectedConnection.profileId}`,
    );
  }

  if (status.connections.length === 0) {
    lines.push("  Saved connections: none");
    return lines.join("\n");
  }

  lines.push("  Saved connections:");
  for (const connection of status.connections) {
    lines.push(`    ${renderConnection(connection)}`);
  }
  return lines.join("\n");
}

function renderConnection(connection: SavedConnection): string {
  const parts = [
    connection.profileId,
    connection.providerName,
    connection.activeModelId ?? "provider default",
    connection.isDefault ? "default" : null,
  ].filter((value): value is string => Boolean(value));
  return `- ${parts.join(" · ")}`;
}

function resolveProfileIdForSelector(
  overview: AuthOverview,
  selector: string,
): string | undefined {
  const trimmed = selector.trim();
  const directMatch = overview.connections.find(
    (connection) => connection.profileId === trimmed,
  );
  if (directMatch) {
    return directMatch.profileId;
  }

  const provider = resolveProvider(overview.providers, trimmed);
  if (!provider) {
    return undefined;
  }

  const status = buildProviderStatus(overview, provider);
  return (
    status.selectedConnection?.profileId ?? status.connections[0]?.profileId
  );
}

function failMissingMethod(provider: ProviderDefinition, label: string): never {
  throw new Error(`${provider.name} does not support ${label}.`);
}

function isInteractiveInput(input: ProviderConnectionInput): boolean {
  return input === "oauth" || input === "device_code" || input === "custom";
}

function createCliPrompter(io: CliIo): CliPrompterLike {
  return {
    async confirm(params) {
      if (!io.isInteractive) {
        throw new Error(
          "Interactive confirmation is required for this connection flow.",
        );
      }

      const suffix = params.initialValue === false ? " [y/N]: " : " [Y/n]: ";
      const answer = (await io.prompt(`${params.message}${suffix}`))
        .trim()
        .toLowerCase();
      if (!answer) {
        return params.initialValue !== false;
      }
      return answer === "y" || answer === "yes";
    },
    intro(title) {
      io.stdout(`${title}\n`);
      return Promise.resolve();
    },
    async multiselect(params) {
      if (!io.isInteractive) {
        throw new Error(
          "Interactive selection is required for this connection flow.",
        );
      }

      io.stdout(`${params.message}\n`);
      params.options.forEach((option, index) => {
        io.stdout(
          `${String(index + 1)}. ${option.label}${option.hint ? ` - ${option.hint}` : ""}\n`,
        );
      });
      const answer = await io.prompt(
        "Select one or more numbers separated by commas: ",
      );
      const indexes = answer
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10) - 1)
        .filter((value) => Number.isInteger(value));
      const selected = indexes
        .map((index) => params.options[index])
        .filter(
          (
            option,
          ): option is {
            hint?: string;
            label: string;
            value: (typeof params.options)[number]["value"];
          } => Boolean(option),
        )
        .map((option) => option.value);

      if (selected.length === 0) {
        throw new Error("At least one option must be selected.");
      }

      return selected;
    },
    note(message, title) {
      io.stdout(`${title ? `${title}: ` : ""}${message}\n`);
      return Promise.resolve();
    },
    outro(message) {
      io.stdout(`${message}\n`);
      return Promise.resolve();
    },
    progress(label) {
      io.stdout(`${label}\n`);
      return {
        stop(message) {
          if (message?.trim()) {
            io.stdout(`${message.trim()}\n`);
          }
        },
        update(message) {
          io.stdout(`${message}\n`);
        },
      };
    },
    async select(params) {
      if (!io.isInteractive) {
        throw new Error(
          "Interactive selection is required for this connection flow.",
        );
      }

      io.stdout(`${params.message}\n`);
      params.options.forEach((option, index) => {
        io.stdout(
          `${String(index + 1)}. ${option.label}${option.hint ? ` - ${option.hint}` : ""}\n`,
        );
      });
      const answer = await io.prompt(
        `Enter a number (1-${String(params.options.length)}): `,
      );
      const index = Number.parseInt(answer.trim(), 10) - 1;
      const option = params.options[index];
      if (!option) {
        throw new Error("Invalid selection.");
      }
      return option.value;
    },
    async text(params) {
      const prompt = `${params.message}${params.placeholder ? ` (${params.placeholder})` : ""}: `;
      const value = isSecretPrompt(params.message, params.placeholder)
        ? await io.promptSecret(prompt)
        : await io.prompt(prompt);
      const validationError = params.validate?.(value);
      if (validationError) {
        throw new Error(validationError);
      }
      return value;
    },
  };
}

function isSecretPrompt(message: string, placeholder?: string): boolean {
  const haystack = `${message} ${placeholder ?? ""}`.toLowerCase();
  return (
    haystack.includes("api key") ||
    haystack.includes("token") ||
    haystack.includes("secret") ||
    haystack.includes("password")
  );
}

function readStringValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === "" ? undefined : trimmed;
}

function writeJson(io: CliIo, payload: unknown): void {
  io.stdout(`${JSON.stringify(payload, null, 2)}\n`);
}

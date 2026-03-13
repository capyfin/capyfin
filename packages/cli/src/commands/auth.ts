import { parseArgs } from "node:util";
import { ProviderAuthService, type ProviderStatus } from "@capyfin/core/auth";
import type { CliIo } from "../io.ts";
import type { ResolvedRunCliOptions } from "../app.ts";

type OutputFormat = "text" | "json";

export async function runAuthCommand(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const subcommand = argv[0] ?? "status";

  switch (subcommand) {
    case "providers":
      printProviders(argv.slice(1), options);
      return;
    case "status":
      await printStatus(argv.slice(1), options);
      return;
    case "login":
      await login(argv.slice(1), options);
      return;
    case "select":
      await selectProvider(argv.slice(1), options);
      return;
    default:
      throw new Error(`Unknown auth command: ${subcommand}`);
  }
}

function printProviders(argv: string[], options: ResolvedRunCliOptions): void {
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
  const service = createAuthService(options);
  const providers = service.listProviders();

  if (output === "json") {
    writeJson(options.io, providers);
    return;
  }

  const lines = ["Available providers:"];

  for (const provider of providers) {
    lines.push(
      `- ${provider.name} (${provider.id}) [${provider.authMethods.map(formatAuthMethod).join(", ")}]`,
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
  const service = createAuthService(options);
  const providerId = positionals[0];

  if (providerId) {
    const providerStatus = await service.getProviderStatus(providerId);

    if (output === "json") {
      writeJson(options.io, providerStatus);
      return;
    }

    options.io.stdout(`${renderProviderStatus(providerStatus)}\n`);
    return;
  }

  const overview = await service.getOverview();
  const visibleProviders = overview.providers.filter(
    (provider) =>
      provider.isSelectedProvider ||
      provider.profiles.length > 0 ||
      provider.environment.available,
  );

  if (output === "json") {
    writeJson(options.io, {
      ...overview,
      providers: visibleProviders,
    });
    return;
  }

  const lines = [
    `Auth store: ${overview.storePath}`,
    `Selected provider: ${overview.selectedProviderId ?? "none"}`,
    `Selected profile: ${overview.selectedProfileId ?? "none"}`,
  ];

  if (visibleProviders.length === 0) {
    lines.push("", "No provider authentication has been configured yet.");
    options.io.stdout(`${lines.join("\n")}\n`);
    return;
  }

  lines.push("", "Configured providers:");
  for (const provider of visibleProviders) {
    lines.push(renderProviderStatus(provider));
  }

  options.io.stdout(`${lines.join("\n\n")}\n`);
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
  const service = createAuthService(options);
  const io = options.io;
  const providerId =
    positionals[0] ?? (await promptForProviderSelection(service, io));
  const provider = service.listProviders().find((entry) => entry.id === providerId);

  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  const activate = !values["skip-activate"];
  const profile = readStringValue(values.profile) ?? "default";
  const secretValue = readStringValue(values["api-key"]) ?? readStringValue(values.token);

  if (values.oauth) {
    const summary = await service.loginWithOAuth({
      activate,
      callbacks: {
        onAuth(info) {
          io.stdout(`Open this URL in your browser:\n${info.url}\n`);
          if (info.instructions) {
            io.stdout(`${info.instructions}\n`);
          }
        },
        onProgress(message) {
          io.stdout(`${message}\n`);
        },
        onPrompt(prompt) {
          const placeholder = prompt.placeholder ? ` (${prompt.placeholder})` : "";
          return io.prompt(`${prompt.message}${placeholder}: `);
        },
      },
      label: profile,
      providerId,
    });

    io.stdout(
      `Stored OAuth profile ${summary.profileId} for ${provider.name}${activate ? " and selected it." : "."}\n`,
    );
    return;
  }

  if (secretValue) {
    const summary = await service.saveSecretProfile({
      activate,
      label: profile,
      providerId,
      secret: secretValue,
    });

    io.stdout(
      `Stored profile ${summary.profileId} for ${provider.name}${activate ? " and selected it." : "."}\n`,
    );
    return;
  }

  const selectedMethod = await resolveInteractiveLoginMethod(provider, io);
  if (selectedMethod === "oauth") {
    const summary = await service.loginWithOAuth({
      activate,
      callbacks: {
        onAuth(info) {
          io.stdout(`Open this URL in your browser:\n${info.url}\n`);
          if (info.instructions) {
            io.stdout(`${info.instructions}\n`);
          }
        },
        onProgress(message) {
          io.stdout(`${message}\n`);
        },
        onPrompt(prompt) {
          const placeholder = prompt.placeholder ? ` (${prompt.placeholder})` : "";
          return io.prompt(`${prompt.message}${placeholder}: `);
        },
      },
      label: profile,
      providerId,
    });

    io.stdout(
      `Stored OAuth profile ${summary.profileId} for ${provider.name}${activate ? " and selected it." : "."}\n`,
    );
    return;
  }

  const secretPrompt =
    selectedMethod === "token"
      ? `Enter ${provider.name} token: `
      : `Enter ${provider.name} API key: `;
  const secret = await io.promptSecret(secretPrompt);

  const summary = await service.saveSecretProfile({
    activate,
    label: profile,
    providerId,
    secret,
  });

  io.stdout(
    `Stored profile ${summary.profileId} for ${provider.name}${activate ? " and selected it." : "."}\n`,
  );
}

async function selectProvider(
  argv: string[],
  options: ResolvedRunCliOptions,
): Promise<void> {
  const { positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {},
    strict: true,
  });
  const selector = positionals[0];

  if (!selector) {
    throw new Error("Missing provider or profile identifier. Usage: capyfin auth select <provider|profile-id>");
  }

  const service = createAuthService(options);
  const providerStatus = await service.selectProvider(selector);

  options.io.stdout(
    `Selected ${providerStatus.provider.name} (${providerStatus.provider.id})${providerStatus.selectedProfileId ? ` using ${providerStatus.selectedProfileId}` : ""}.\n`,
  );
}

function createAuthService(options: ResolvedRunCliOptions): ProviderAuthService {
  return new ProviderAuthService({
    env: options.env,
    ...(options.now ? { now: options.now } : {}),
    ...(options.storePath ? { storePath: options.storePath } : {}),
  });
}

function formatAuthMethod(method: string): string {
  return method.replaceAll("_", "-");
}

async function promptForProviderSelection(
  service: ProviderAuthService,
  io: CliIo,
): Promise<string> {
  if (!io.isInteractive) {
    throw new Error("Provider is required in non-interactive mode.");
  }

  const providers = service.listProviders();
  io.stdout("Select a provider:\n");
  providers.forEach((provider, index) => {
    io.stdout(
      `${String(index + 1)}. ${provider.name} (${provider.id}) [${provider.authMethods.map(formatAuthMethod).join(", ")}]\n`,
    );
  });

  const selection = await io.prompt(
    `Enter a number (1-${String(providers.length)}): `,
  );
  const index = Number.parseInt(selection, 10) - 1;

  if (!Number.isInteger(index) || index < 0 || index >= providers.length) {
    throw new Error("Invalid provider selection.");
  }

  const provider = providers[index];
  if (!provider) {
    throw new Error("Invalid provider selection.");
  }

  return provider.id;
}

async function resolveInteractiveLoginMethod(
  provider: ProviderStatus["provider"],
  io: CliIo,
): Promise<"api_key" | "oauth" | "token"> {
  const interactiveMethods = provider.authMethods.filter(
    (method): method is "api_key" | "oauth" | "token" =>
      method === "api_key" || method === "oauth" || method === "token",
  );

  if (interactiveMethods.length === 0) {
    throw new Error(`${provider.name} does not support interactive login yet.`);
  }

  if (interactiveMethods.length === 1) {
    const onlyMethod = interactiveMethods[0];
    if (!onlyMethod) {
      throw new Error(`${provider.name} does not support interactive login yet.`);
    }

    return onlyMethod;
  }

  if (!io.isInteractive) {
    throw new Error(
      `${provider.name} supports multiple auth methods. Pass --oauth or provide a static credential flag.`,
    );
  }

  io.stdout(`Select an auth method for ${provider.name}:\n`);
  interactiveMethods.forEach((method, index) => {
    io.stdout(`${String(index + 1)}. ${formatAuthMethod(method)}\n`);
  });

  const selection = await io.prompt(
    `Enter a number (1-${String(interactiveMethods.length)}): `,
  );
  const index = Number.parseInt(selection, 10) - 1;

  if (!Number.isInteger(index) || index < 0 || index >= interactiveMethods.length) {
    throw new Error("Invalid auth method selection.");
  }

  const selectedMethod = interactiveMethods[index];
  if (!selectedMethod) {
    throw new Error("Invalid auth method selection.");
  }

  return selectedMethod;
}

function renderProviderStatus(provider: ProviderStatus): string {
  const lines = [
    `${provider.isSelectedProvider ? "*" : "-"} ${provider.provider.name} (${provider.provider.id})`,
    `  Methods: ${provider.provider.authMethods.map(formatAuthMethod).join(", ")}`,
    `  Profiles: ${provider.profiles.length > 0 ? provider.profiles.map((profile) => `${profile.profileId}${profile.isActiveProfile ? " [active]" : ""}`).join(", ") : "none"}`,
    `  Environment: ${provider.environment.available ? (provider.environment.sourceLabel ?? "configured") : "not configured"}`,
    `  Resolution: ${provider.resolved ? provider.resolved.description : "none"}`,
  ];

  return lines.join("\n");
}

function readStringValue(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function writeJson(io: CliIo, value: unknown): void {
  io.stdout(`${JSON.stringify(value, null, 2)}\n`);
}

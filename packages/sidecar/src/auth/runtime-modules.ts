/* eslint-disable @typescript-eslint/array-type, @typescript-eslint/consistent-type-definitions */

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveGatewayPackageRoot } from "../internal-gateway/package-paths.ts";

type AuthChoiceGroup = {
  hint?: string;
  label: string;
  options: Array<{
    hint?: string;
    label: string;
    value: string;
  }>;
  value: string;
};

type GatewayConfig = Record<string, unknown>;

type AuthChoiceOptionsModule = {
  buildAuthChoiceGroups(params: {
    config?: GatewayConfig;
    env?: NodeJS.ProcessEnv;
    includeSkip: boolean;
    store: {
      profiles: Record<string, unknown>;
      version: number;
    };
    workspaceDir?: string;
  }): {
    groups: AuthChoiceGroup[];
  };
};

type AuthChoiceModule = {
  applyAuthChoice(params: {
    agentDir?: string;
    authChoice: string;
    config: GatewayConfig;
    opts?: Record<string, unknown>;
    prompter: WizardPrompterLike;
    runtime: RuntimeEnvLike;
    setDefaultModel: boolean;
  }): Promise<{
    agentModelOverride?: string;
    config: GatewayConfig;
  }>;
  resolvePreferredProviderForAuthChoice(params: {
    choice: string;
    config?: GatewayConfig;
    env?: NodeJS.ProcessEnv;
    workspaceDir?: string;
  }): string | undefined;
};

export type WizardPrompterLike = {
  confirm(params: {
    initialValue?: boolean;
    message: string;
  }): Promise<boolean>;
  intro(title: string): Promise<void>;
  multiselect<T>(params: {
    initialValues?: T[];
    message: string;
    options: Array<{ hint?: string; label: string; value: T }>;
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
    options: Array<{ hint?: string; label: string; value: T }>;
  }): Promise<T>;
  text(params: {
    initialValue?: string;
    message: string;
    placeholder?: string;
    validate?: (value: string) => string | undefined;
  }): Promise<string>;
};

export type RuntimeEnvLike = {
  error: (...args: unknown[]) => void;
  exit: (code: number) => void;
  log: (...args: unknown[]) => void;
};

let authChoiceModulePromise: Promise<AuthChoiceModule> | null = null;
let authChoiceOptionsModulePromise: Promise<AuthChoiceOptionsModule> | null = null;

async function listDistModules(prefix: string): Promise<string[]> {
  const distDir = join(resolveGatewayPackageRoot(), "dist");
  const entries = (await readdir(distDir))
    .filter((entry) => entry.startsWith(prefix) && entry.endsWith(".js"))
    .sort();

  return entries.map((entry) => pathToFileURL(join(distDir, entry)).href);
}

export async function loadAuthChoiceOptionsModule(): Promise<AuthChoiceOptionsModule> {
  authChoiceOptionsModulePromise ??= (async () => {
    const moduleUrls = await listDistModules("auth-choice-options-");
    for (const moduleUrl of moduleUrls) {
      const module = (await import(moduleUrl)) as Record<string, unknown>;
      const buildAuthChoiceGroups = Object.values(module).find(
        (value): value is AuthChoiceOptionsModule["buildAuthChoiceGroups"] =>
          typeof value === "function" && value.name === "buildAuthChoiceGroups",
      );

      if (buildAuthChoiceGroups) {
        return {
          buildAuthChoiceGroups,
        };
      }
    }

    throw new Error(
      "Embedded runtime auth-choice-options module is missing buildAuthChoiceGroups.",
    );
  })();

  return await authChoiceOptionsModulePromise;
}

export async function loadAuthChoiceModule(): Promise<AuthChoiceModule> {
  authChoiceModulePromise ??= (async () => {
    const moduleUrls = await listDistModules("auth-choice-");
    for (const moduleUrl of moduleUrls) {
      const module = (await import(moduleUrl)) as Record<string, unknown>;
      const directApplyAuthChoice = Object.values(module).find(
        (value): value is AuthChoiceModule["applyAuthChoice"] =>
          typeof value === "function" && value.name === "applyAuthChoice",
      );
      const exportsObject = Object.values(module).find(
        (value): value is {
          applyAuthChoice?: AuthChoiceModule["applyAuthChoice"];
          resolvePreferredProviderForAuthChoice?: AuthChoiceModule["resolvePreferredProviderForAuthChoice"];
        } =>
          value !== null &&
          typeof value === "object" &&
          "resolvePreferredProviderForAuthChoice" in value,
      );
      const resolvePreferredProviderForAuthChoice =
        exportsObject?.resolvePreferredProviderForAuthChoice ??
        Object.values(module).find(
          (value): value is AuthChoiceModule["resolvePreferredProviderForAuthChoice"] =>
            typeof value === "function" &&
            value.name === "resolvePreferredProviderForAuthChoice",
        );
      const applyAuthChoice =
        exportsObject?.applyAuthChoice ?? directApplyAuthChoice;

      if (applyAuthChoice && resolvePreferredProviderForAuthChoice) {
        return {
          applyAuthChoice,
          resolvePreferredProviderForAuthChoice,
        };
      }
    }

    throw new Error(
      "Embedded runtime auth-choice module is missing applyAuthChoice helpers.",
    );
  })();

  return await authChoiceModulePromise;
}

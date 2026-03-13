import assert from "node:assert/strict";
import test from "node:test";
import type { AuthOverview } from "@/app/types";
import type { ProviderFamily } from "./provider-families";
import { resolvePreferredOptionKey } from "./selection";

void test("resolvePreferredOptionKey prefers the resolved auth method when a provider exposes multiple options", () => {
  const tokenProviderStatus = {
    environment: {
      available: false,
      envVars: [],
    },
    isSelectedProfileProvider: true,
    isSelectedProvider: true,
    profiles: [],
    provider: {
      authMethods: ["token", "oauth"],
      envVars: [],
      id: "github-copilot",
      name: "GitHub Copilot",
      secretType: "token",
    },
    resolved: {
      description: "Stored oauth profile",
      method: "oauth",
      profileId: "github-copilot:default",
      source: "profile",
    },
    selectedProfileId: "github-copilot:default",
  } satisfies NonNullable<ProviderFamily["options"][number]["providerStatus"]>;
  const oauthProviderStatus = {
    environment: {
      available: false,
      envVars: [],
    },
    isSelectedProfileProvider: true,
    isSelectedProvider: true,
    profiles: [],
    provider: {
      authMethods: ["token", "oauth"],
      envVars: [],
      id: "github-copilot",
      name: "GitHub Copilot",
      secretType: "token",
    },
    resolved: {
      description: "Stored oauth profile",
      method: "oauth",
      profileId: "github-copilot:default",
      source: "profile",
    },
    selectedProfileId: "github-copilot:default",
  } satisfies NonNullable<ProviderFamily["options"][number]["providerStatus"]>;
  const family: ProviderFamily = {
    description: "Copilot auth",
    id: "github-copilot",
    isConnected: true,
    isSelected: true,
    options: [
      {
        description: "Token",
        isAvailable: true,
        isConnected: true,
        isSelected: true,
        key: "github-copilot:token",
        label: "Use token",
        mode: "token",
        providerId: "github-copilot",
        providerStatus: tokenProviderStatus,
      },
      {
        description: "OAuth",
        isAvailable: true,
        isConnected: true,
        isSelected: true,
        key: "github-copilot:oauth",
        label: "Sign in with GitHub",
        mode: "oauth",
        providerId: "github-copilot",
        providerStatus: oauthProviderStatus,
      },
    ],
    title: "GitHub Copilot",
  };
  const overview: AuthOverview = {
    providers: [tokenProviderStatus, oauthProviderStatus],
    selectedProfileId: "github-copilot:default",
    selectedProviderId: "github-copilot",
    storePath: "/tmp/auth-profiles.json",
  };

  assert.equal(resolvePreferredOptionKey(family, overview), "github-copilot:oauth");
});

void test("resolvePreferredOptionKey does not force the first option when multiple methods share the same provider id", () => {
  const family: ProviderFamily = {
    description: "Copilot auth",
    id: "github-copilot",
    isConnected: false,
    isSelected: false,
    options: [
      {
        description: "Token",
        isAvailable: true,
        isConnected: false,
        isSelected: false,
        key: "github-copilot:token",
        label: "Use token",
        mode: "token",
        providerId: "github-copilot",
      },
      {
        description: "OAuth",
        isAvailable: true,
        isConnected: false,
        isSelected: false,
        key: "github-copilot:oauth",
        label: "Sign in with GitHub",
        mode: "oauth",
        providerId: "github-copilot",
      },
    ],
    title: "GitHub Copilot",
  };
  const overview: AuthOverview = {
    providers: [],
    selectedProviderId: "github-copilot",
    storePath: "/tmp/auth-profiles.json",
  };

  assert.equal(resolvePreferredOptionKey(family, overview), null);
});

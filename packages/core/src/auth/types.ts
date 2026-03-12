import type { OAuthCredentials } from "@mariozechner/pi-ai";

export type StoredCredentialType = "api_key" | "oauth" | "token";
export type ProviderAuthMethod =
  | StoredCredentialType
  | "application_default"
  | "aws_sdk";

export interface ProviderDefinition {
  id: string;
  name: string;
  authMethods: readonly ProviderAuthMethod[];
  envVars: readonly string[];
  secretType?: Extract<StoredCredentialType, "api_key" | "token"> | undefined;
  oauthProviderId?: string | undefined;
  description?: string | undefined;
}

export interface ApiKeyProfile {
  type: "api_key";
  provider: string;
  label: string;
  key: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenProfile {
  type: "token";
  provider: string;
  label: string;
  token: string;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthProfile {
  type: "oauth";
  provider: string;
  label: string;
  credentials: OAuthCredentials;
  createdAt: string;
  updatedAt: string;
}

export type AuthProfile = ApiKeyProfile | TokenProfile | OAuthProfile;

export interface AuthStore {
  version: 1;
  profiles: Record<string, AuthProfile>;
  order: Record<string, string[]>;
  activeProviderId?: string | undefined;
  activeProfileId?: string | undefined;
}

export interface AuthStoreLocation {
  configDir: string;
  authStorePath: string;
}

export interface StoredProfileSummary {
  profileId: string;
  providerId: string;
  label: string;
  type: StoredCredentialType;
  createdAt: string;
  updatedAt: string;
  isActiveProfile: boolean;
}

export interface EnvironmentAuthStatus {
  available: boolean;
  method?: ProviderAuthMethod | undefined;
  sourceLabel?: string | undefined;
  envVars: readonly string[];
}

export interface ResolvedProviderSource {
  source: "profile" | "environment";
  method: ProviderAuthMethod;
  profileId?: string | undefined;
  description: string;
}

export interface ProviderStatus {
  provider: ProviderDefinition;
  isSelectedProvider: boolean;
  isSelectedProfileProvider: boolean;
  profiles: StoredProfileSummary[];
  selectedProfileId?: string | undefined;
  environment: EnvironmentAuthStatus;
  resolved?: ResolvedProviderSource | undefined;
}

export interface AuthOverview {
  storePath: string;
  selectedProviderId?: string | undefined;
  selectedProfileId?: string | undefined;
  providers: ProviderStatus[];
}

export interface ResolvedProviderCredential {
  providerId: string;
  method: ProviderAuthMethod;
  source: "profile" | "environment";
  sourceLabel: string;
  profileId?: string | undefined;
  secret?: string | undefined;
  credentials?: OAuthCredentials | undefined;
}

export interface AuthServiceOptions {
  env?: NodeJS.ProcessEnv;
  now?: () => Date;
  storePath?: string;
}

export interface SaveSecretProfileParams {
  providerId: string;
  secret: string;
  label?: string | undefined;
  activate?: boolean | undefined;
}

export interface SaveOAuthProfileParams {
  providerId: string;
  credentials: OAuthCredentials;
  label?: string | undefined;
  activate?: boolean | undefined;
}

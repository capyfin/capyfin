import type {
  OAuthCredentials,
  OAuthLoginCallbacks,
  OAuthPrompt,
  OAuthProviderInterface,
} from "@mariozechner/pi-ai/oauth";

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const REDIRECT_URI = "http://localhost:1455/auth/callback";
const SCOPE = "openid profile email offline_access";
const JWT_CLAIM_PATH = "https://api.openai.com/auth";
const SUCCESS_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Authentication successful</title>
</head>
<body>
  <p>Authentication successful. Return to CapyFin to continue.</p>
</body>
</html>`;

interface TokenSuccess {
  type: "success";
  access: string;
  refresh: string;
  expires: number;
}

interface TokenFailure {
  type: "failed";
}

type TokenResult = TokenSuccess | TokenFailure;

interface JwtPayload {
  [JWT_CLAIM_PATH]?: {
    chatgpt_account_id?: string;
  };
  [key: string]: unknown;
}

interface CallbackServer {
  close(): void;
  cancelWait(): void;
  waitForCode(): Promise<{ code: string } | null>;
}

type NodeCreateHash = typeof import("node:crypto").createHash;
type NodeRandomBytes = typeof import("node:crypto").randomBytes;
type NodeCreateServer = typeof import("node:http").createServer;

interface OpenAICodexProviderDependencies {
  createAuthorizationFlow(originator?: string): Promise<{
    verifier: string;
    state: string;
    url: string;
  }>;
  exchangeAuthorizationCode(
    code: string,
    verifier: string,
    redirectUri?: string,
  ): Promise<TokenResult>;
  getAccountId(accessToken: string): string | null;
  refreshAccessToken(refreshToken: string): Promise<TokenResult>;
  startCallbackServer(state: string): Promise<CallbackServer>;
}

let randomBytesLoader: Promise<NodeRandomBytes> | undefined;
let createHashLoader: Promise<NodeCreateHash> | undefined;
let createServerLoader: Promise<NodeCreateServer> | undefined;

export function createOpenAICodexOAuthProvider(
  dependencies: Partial<OpenAICodexProviderDependencies> = {},
): OAuthProviderInterface {
  const createAuthorizationFlow =
    dependencies.createAuthorizationFlow ?? defaultCreateAuthorizationFlow;
  const exchangeAuthorizationCode =
    dependencies.exchangeAuthorizationCode ?? defaultExchangeAuthorizationCode;
  const getAccountId = dependencies.getAccountId ?? defaultGetAccountId;
  const refreshAccessToken =
    dependencies.refreshAccessToken ?? defaultRefreshAccessToken;
  const startCallbackServer =
    dependencies.startCallbackServer ?? defaultStartCallbackServer;

  return {
    id: "openai-codex",
    name: "ChatGPT Plus/Pro (Codex Subscription)",
    usesCallbackServer: true,

    async login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
      const { verifier, state, url } = await createAuthorizationFlow("capyfin");
      const callbackServer = await startCallbackServer(state);

      callbacks.onAuth({
        instructions: "A browser window should open. Complete sign-in to finish.",
        url,
      });

      try {
        const code = await resolveAuthorizationCode(callbackServer, callbacks, state);
        if (!code) {
          throw new Error("Missing authorization code.");
        }

        const tokenResult = await exchangeAuthorizationCode(code, verifier);
        if (tokenResult.type !== "success") {
          throw new Error("Token exchange failed.");
        }

        const accountId = getAccountId(tokenResult.access);
        if (!accountId) {
          throw new Error("Failed to extract accountId from token.");
        }

        return {
          access: tokenResult.access,
          refresh: tokenResult.refresh,
          expires: tokenResult.expires,
          accountId,
        };
      } finally {
        callbackServer.close();
      }
    },

    async refreshToken(credentials: OAuthCredentials): Promise<OAuthCredentials> {
      const tokenResult = await refreshAccessToken(credentials.refresh);
      if (tokenResult.type !== "success") {
        throw new Error("Failed to refresh OpenAI Codex token.");
      }

      const accountId = getAccountId(tokenResult.access);
      if (!accountId) {
        throw new Error("Failed to extract accountId from token.");
      }

      return {
        access: tokenResult.access,
        refresh: tokenResult.refresh,
        expires: tokenResult.expires,
        accountId,
      };
    },

    getApiKey(credentials: OAuthCredentials): string {
      return credentials.access;
    },
  };
}

async function resolveAuthorizationCode(
  callbackServer: CallbackServer,
  callbacks: OAuthLoginCallbacks,
  expectedState: string,
): Promise<string | undefined> {
  if (callbacks.onManualCodeInput) {
    const manualPromise = callbacks
      .onManualCodeInput()
      .then((input) => {
        callbackServer.cancelWait();
        return { input };
      })
      .catch((error: unknown) => {
        callbackServer.cancelWait();
        return { error: toError(error) };
      });

    const callbackResult = await callbackServer.waitForCode();
    if (callbackResult?.code) {
      return callbackResult.code;
    }

    const manualResult = await manualPromise;
    if ("error" in manualResult) {
      throw manualResult.error;
    }
    if (manualResult.input) {
      return parseAuthorizationInput(manualResult.input, expectedState);
    }
  } else {
    const callbackResult = await callbackServer.waitForCode();
    if (callbackResult?.code) {
      return callbackResult.code;
    }
  }

  return parseAuthorizationInput(
    await callbacks.onPrompt({
      message: "Paste the authorization code (or full redirect URL):",
    } satisfies OAuthPrompt),
    expectedState,
  );
}

async function defaultCreateAuthorizationFlow(originator = "capyfin"): Promise<{
  verifier: string;
  state: string;
  url: string;
}> {
  const { challenge, verifier } = await generatePkcePair();
  const randomBytes = await getNodeRandomBytes();
  const state = randomBytes(16).toString("hex");

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("id_token_add_organizations", "true");
  url.searchParams.set("codex_cli_simplified_flow", "true");
  url.searchParams.set("originator", originator);

  return { verifier, state, url: url.toString() };
}

async function defaultExchangeAuthorizationCode(
  code: string,
  verifier: string,
  redirectUri = REDIRECT_URI,
): Promise<TokenResult> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    return { type: "failed" };
  }

  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (
    typeof json.access_token !== "string" ||
    typeof json.refresh_token !== "string" ||
    typeof json.expires_in !== "number"
  ) {
    return { type: "failed" };
  }

  return {
    type: "success",
    access: json.access_token,
    refresh: json.refresh_token,
    expires: Date.now() + json.expires_in * 1_000,
  };
}

function defaultGetAccountId(accessToken: string): string | null {
  const payload = decodeJwt(accessToken);
  const auth = payload?.[JWT_CLAIM_PATH];
  const accountId = auth?.chatgpt_account_id;

  return typeof accountId === "string" && accountId.length > 0
    ? accountId
    : null;
}

async function defaultRefreshAccessToken(
  refreshToken: string,
): Promise<TokenResult> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });

  if (!response.ok) {
    return { type: "failed" };
  }

  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (
    typeof json.access_token !== "string" ||
    typeof json.refresh_token !== "string" ||
    typeof json.expires_in !== "number"
  ) {
    return { type: "failed" };
  }

  return {
    type: "success",
    access: json.access_token,
    refresh: json.refresh_token,
    expires: Date.now() + json.expires_in * 1_000,
  };
}

async function defaultStartCallbackServer(state: string): Promise<CallbackServer> {
  const createServer = await getNodeCreateServer();

  return await new Promise((resolve) => {
    let lastCode: string | null = null;
    let cancelled = false;
    const server = createServer((request, response) => {
      try {
        const url = new URL(request.url ?? "", "http://localhost");
        if (url.pathname !== "/auth/callback") {
          response.statusCode = 404;
          response.end("Not found");
          return;
        }

        if (url.searchParams.get("state") !== state) {
          response.statusCode = 400;
          response.end("State mismatch");
          return;
        }

        const code = url.searchParams.get("code");
        if (!code) {
          response.statusCode = 400;
          response.end("Missing authorization code");
          return;
        }

        response.statusCode = 200;
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(SUCCESS_HTML);
        lastCode = code;
      } catch {
        response.statusCode = 500;
        response.end("Internal error");
      }
    });

    server
      .listen(1455, "127.0.0.1", () => {
        resolve({
          close: () => {
            server.close();
          },
          cancelWait: () => {
            cancelled = true;
          },
          waitForCode: async () => {
            for (let index = 0; index < 600; index += 1) {
              if (lastCode) {
                return { code: lastCode };
              }

              if (cancelled) {
                return null;
              }

              await new Promise((resolveSleep) => {
                setTimeout(resolveSleep, 100);
              });
            }

            return null;
          },
        });
      })
      .on("error", () => {
        resolve({
          close: () => {
            try {
              server.close();
            } catch {
              // Ignore cleanup failures.
            }
          },
          cancelWait: () => {
            return undefined;
          },
          waitForCode: () => Promise.resolve(null),
        });
      });
  });
}

async function getNodeRandomBytes(): Promise<NodeRandomBytes> {
  randomBytesLoader ??= import("node:crypto").then((module) => module.randomBytes);
  return randomBytesLoader;
}

async function getNodeCreateHash(): Promise<NodeCreateHash> {
  createHashLoader ??= import("node:crypto").then((module) => module.createHash);
  return createHashLoader;
}

async function getNodeCreateServer(): Promise<NodeCreateServer> {
  createServerLoader ??= import("node:http").then((module) => module.createServer);
  return createServerLoader;
}

async function generatePkcePair(): Promise<{
  challenge: string;
  verifier: string;
}> {
  const createHash = await getNodeCreateHash();
  const randomBytes = await getNodeRandomBytes();
  const verifier = toBase64Url(randomBytes(32));
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { challenge, verifier };
}

function parseAuthorizationInput(
  input: string,
  expectedState: string,
): string | undefined {
  const value = input.trim();
  if (!value) {
    return undefined;
  }

  const parsed = parseAuthorizationCodeAndState(value);
  if (parsed.state && parsed.state !== expectedState) {
    throw new Error("State mismatch.");
  }

  return parsed.code;
}

function parseAuthorizationCodeAndState(input: string): {
  code?: string;
  state?: string;
} {
  try {
    const url = new URL(input);
    return compactOptionalFields({
      code: url.searchParams.get("code") ?? undefined,
      state: url.searchParams.get("state") ?? undefined,
    });
  } catch {
    // Ignore invalid URLs and continue with manual parsing.
  }

  if (input.includes("#")) {
    const [code, state] = input.split("#", 2);
    return compactOptionalFields({ code, state });
  }

  if (input.includes("code=")) {
    const params = new URLSearchParams(input);
    return compactOptionalFields({
      code: params.get("code") ?? undefined,
      state: params.get("state") ?? undefined,
    });
  }

  return { code: input };
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    return JSON.parse(atob(parts[1] ?? "")) as JwtPayload;
  } catch {
    return null;
  }
}

function toBase64Url(value: Uint8Array): string {
  return Buffer.from(value).toString("base64url");
}

function compactOptionalFields(value: {
  code: string | undefined;
  state: string | undefined;
}): {
  code?: string;
  state?: string;
} {
  return {
    ...(value.code !== undefined ? { code: value.code } : {}),
    ...(value.state !== undefined ? { state: value.state } : {}),
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

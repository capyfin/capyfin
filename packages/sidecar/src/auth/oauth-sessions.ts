import { randomUUID } from "node:crypto";
import type { OAuthLoginCallbacks } from "@mariozechner/pi-ai/oauth";
import type { OAuthSession, OAuthSessionStep } from "@capyfin/contracts";
import { ProviderAuthService } from "@capyfin/core/auth";

type CreateAuthService = () => ProviderAuthService;

interface PendingPrompt {
  allowEmpty: boolean;
  resolve(value: string): void;
  reject(error: Error): void;
}

interface OAuthSessionRecord {
  pendingPrompt?: PendingPrompt;
  snapshot: OAuthSession;
}

interface OAuthSessionManagerOptions {
  afterProfileStored?: () => Promise<void> | void;
}

export class OAuthSessionManager {
  readonly #createAuthService: CreateAuthService;
  readonly #afterProfileStored?: OAuthSessionManagerOptions["afterProfileStored"];
  readonly #sessions = new Map<string, OAuthSessionRecord>();

  constructor(
    createAuthService: CreateAuthService,
    options: OAuthSessionManagerOptions = {},
  ) {
    this.#createAuthService = createAuthService;
    this.#afterProfileStored = options.afterProfileStored;
  }

  get(sessionId: string): OAuthSession | undefined {
    return this.#sessions.get(sessionId)?.snapshot;
  }

  start(params: {
    label?: string;
    providerId: string;
  }): OAuthSession {
    const service = this.#createAuthService();
    const provider = service
      .listProviders()
      .find((candidate) => candidate.id === params.providerId);

    if (!provider) {
      throw new Error(`Unknown provider: ${params.providerId}`);
    }

    if (!provider.authMethods.includes("oauth")) {
      throw new Error(`${provider.name} does not support OAuth sign-in.`);
    }

    const snapshot: OAuthSession = {
      id: randomUUID(),
      providerId: provider.id,
      providerName: provider.name,
      progress: ["Starting sign-in flow"],
      state: "pending",
      step: {
        message: "Preparing sign-in flow",
        type: "working",
      },
    };
    const record: OAuthSessionRecord = {
      snapshot,
    };

    this.#sessions.set(snapshot.id, record);
    void this.#run(record, params);

    return snapshot;
  }

  respond(sessionId: string, value: string): OAuthSession {
    const record = this.#sessions.get(sessionId);
    if (!record) {
      throw new Error(`Unknown OAuth session: ${sessionId}`);
    }

    if (!record.pendingPrompt) {
      throw new Error("This sign-in flow is not waiting for input.");
    }

    const promptStep = record.snapshot.step;
    const submittedValue = record.pendingPrompt.allowEmpty ? value : value.trim();

    if (
      promptStep.type === "prompt" &&
      !promptStep.allowEmpty &&
      submittedValue.length === 0
    ) {
      throw new Error("A value is required to continue the sign-in flow.");
    }

    const pendingPrompt = record.pendingPrompt;
    delete record.pendingPrompt;
    this.#updateStep(record, {
      message: "Continuing sign-in flow",
      type: "working",
    });
    pendingPrompt.resolve(submittedValue);

    return record.snapshot;
  }

  async #run(
    record: OAuthSessionRecord,
    params: {
      label?: string;
      providerId: string;
    },
  ): Promise<void> {
    const service = this.#createAuthService();

    try {
      const summary = await service.loginWithOAuth({
        ...(params.label ? { label: params.label } : {}),
        callbacks: this.#createCallbacks(record),
        providerId: params.providerId,
      });

      record.snapshot = {
        ...record.snapshot,
        profile: summary,
        progress: [...record.snapshot.progress, `Connected ${summary.profileId}`],
        state: "completed",
        step: {
          type: "completed",
        },
      };
      await this.#afterProfileStored?.();
    } catch (error) {
      const message = getErrorMessage(error);
      if (record.pendingPrompt) {
        record.pendingPrompt.reject(new Error(message));
        delete record.pendingPrompt;
      }

      record.snapshot = {
        ...record.snapshot,
        error: message,
        progress: [...record.snapshot.progress, message],
        state: "error",
        step: {
          message,
          type: "error",
        },
      };
    }
  }

  #createCallbacks(record: OAuthSessionRecord): OAuthLoginCallbacks {
    return {
      onAuth: (info) => {
        record.snapshot = {
          ...record.snapshot,
          authInstructions: info.instructions,
          authUrl: info.url,
          progress: [...record.snapshot.progress, "Browser sign-in started"],
          step: {
            ...(info.instructions ? { instructions: info.instructions } : {}),
            type: "auth_link",
            url: info.url,
          },
        };
      },
      onManualCodeInput: () =>
        this.#waitForPrompt(record, {
          allowEmpty: false,
          message: "Paste the verification code from the browser",
          placeholder: "Verification code",
          type: "prompt",
        }),
      onProgress: (message) => {
        record.snapshot = {
          ...record.snapshot,
          progress: [...record.snapshot.progress, message].slice(-12),
          step:
            record.snapshot.step.type === "auth_link" ||
            record.snapshot.step.type === "prompt"
              ? record.snapshot.step
              : {
                  message,
                  type: "working",
                },
        };
      },
      onPrompt: (prompt) =>
        this.#waitForPrompt(record, {
          ...(prompt.placeholder ? { placeholder: prompt.placeholder } : {}),
          allowEmpty: prompt.allowEmpty ?? false,
          message: prompt.message,
          type: "prompt",
        }),
    };
  }

  #updateStep(record: OAuthSessionRecord, step: OAuthSessionStep): void {
    record.snapshot = {
      ...record.snapshot,
      step,
    };
  }

  #waitForPrompt(
    record: OAuthSessionRecord,
    step: Extract<OAuthSessionStep, { type: "prompt" }>,
  ): Promise<string> {
    record.snapshot = {
      ...record.snapshot,
      progress: [...record.snapshot.progress, step.message].slice(-12),
      step,
    };

    return new Promise<string>((resolve, reject) => {
      record.pendingPrompt = {
        allowEmpty: step.allowEmpty,
        reject,
        resolve,
      };
    });
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

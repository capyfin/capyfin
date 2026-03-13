import assert from "node:assert/strict";
import test from "node:test";
import type { OAuthSession } from "@/app/types";
import {
  getOAuthAutomationResponse,
  isGitHubEnterprisePrompt,
  shouldAutoSubmitOAuthPrompt,
} from "./oauth-flow";

void test("getOAuthAutomationResponse skips the enterprise prompt for standard GitHub sign-in", () => {
  assert.equal(getOAuthAutomationResponse("github-public", ""), "");
  assert.equal(
    getOAuthAutomationResponse("github-enterprise", " company.ghe.com "),
    "company.ghe.com",
  );
  assert.equal(getOAuthAutomationResponse("standard", "ignored"), null);
});

void test("shouldAutoSubmitOAuthPrompt only matches the GitHub enterprise prompt for the active session", () => {
  const session: OAuthSession = {
    id: "session-1",
    progress: [],
    providerId: "github-copilot",
    providerName: "GitHub Copilot",
    state: "pending",
    step: {
      allowEmpty: true,
      message: "GitHub Enterprise URL/domain (blank for github.com)",
      placeholder: "company.ghe.com",
      type: "prompt",
    },
  };

  assert.equal(isGitHubEnterprisePrompt(session.step), true);
  assert.equal(
    shouldAutoSubmitOAuthPrompt(session, {
      response: "",
      sessionId: "session-1",
    }),
    true,
  );
  assert.equal(
    shouldAutoSubmitOAuthPrompt(session, {
      response: "",
      sessionId: "session-2",
    }),
    false,
  );
});

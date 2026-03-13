import type { OAuthSession } from "@/app/types";
import type { OAuthExperience } from "./provider-families";

export interface PendingOAuthAutomation {
  response: string;
  sessionId: string;
}

export function getOAuthAutomationResponse(
  oauthExperience: OAuthExperience | undefined,
  promptValue: string,
): string | null {
  switch (oauthExperience) {
    case "github-public":
      return "";
    case "github-enterprise":
      return promptValue.trim();
    default:
      return null;
  }
}

export function shouldAutoSubmitOAuthPrompt(
  session: OAuthSession,
  automation: PendingOAuthAutomation | null,
): automation is PendingOAuthAutomation {
  return (
    automation !== null &&
    automation.sessionId === session.id &&
    isGitHubEnterprisePrompt(session.step)
  );
}

export function isGitHubEnterprisePrompt(
  step: OAuthSession["step"],
): boolean {
  return (
    step.type === "prompt" &&
    step.message.toLowerCase().includes("github enterprise")
  );
}

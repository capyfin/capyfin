/**
 * Derive a display label for a chat session.
 *
 * - If the session already has a label, return it as-is.
 * - Otherwise return "New conversation".
 */
export function formatSessionLabel(session: {
  label?: string | undefined;
}): string {
  return session.label ?? "New conversation";
}

/**
 * Derive a session label from the first user message text.
 * Collapses whitespace and truncates to ~40 characters.
 */
export function deriveSessionLabel(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 40) {
    return trimmed;
  }
  return `${trimmed.slice(0, 37)}...`;
}

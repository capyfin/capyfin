import type { ActionCard } from "./types";

/**
 * Standard quality gate appended to every card prompt.
 * Matches spec section 6.
 */
export const QUALITY_GATE = `After completing your analysis, self-check:
- Every factual claim must cite a specific source (URL, filing, or data provider) and date
- Every bullish point must be paired with the primary risk that could invalidate it
- Rate your confidence per section: HIGH (hard data), MEDIUM (reasonable inference), LOW (hypothesis)
- If you find yourself uniformly bullish or bearish, you've missed something — dig deeper
- State the data tier: what data sources you used and what would improve with better data
- Be specific to THIS stock / THIS market condition — reject any output that could apply to any ticker`;

/**
 * Build the full 6-part prompt from card metadata and optional user input.
 *
 * Parts:
 * 1. Skill reading instructions
 * 2. Persona instruction (if applicable)
 * 3. Context instruction (watchlist + preferences)
 * 4. Data tier instruction
 * 5. Task-specific instructions (with ticker/input interpolated)
 * 6. Quality gate
 */
export function buildCardPrompt(card: ActionCard, input?: string): string {
  const parts: string[] = [];

  // Part 1 — Skill reading instructions
  for (const skillId of card.skills) {
    parts.push(
      `Read and follow the skill at ./skills/finance/${skillId}/SKILL.md\nIf the skill references files in its references/ subdirectory, read those too.`,
    );
  }

  // Part 2 — Persona instruction
  if (card.persona) {
    parts.push(
      `Read ./skills/personas/${card.persona}/SKILL.md and adopt its domain expertise and quality standards for this analysis.`,
    );
  }

  // Part 3 — Context instruction
  parts.push(
    `Read watchlist.csv if it exists for the user's tracked positions.\nRead PREFERENCES.md if it exists for the user's investment style and risk tolerance.`,
  );

  // Part 4 — Data tier instruction
  parts.push(
    `Use the best data source available. Prefer structured API data (FMP) if the user has configured it. Fall back to web search and public sources. If operating on web search only, note what better data would improve.`,
  );

  // Part 5 — Task-specific instructions
  let taskPrompt = card.prompt;
  if (input) {
    taskPrompt = taskPrompt
      .replace(/\{ticker\}/g, input)
      .replace(/\{input\}/g, input);
  }
  parts.push(taskPrompt);

  // Part 6 — Quality gate
  parts.push(QUALITY_GATE);

  return parts.join("\n\n");
}

/**
 * Build a user-facing display label for a card execution.
 * e.g. "Morning Brief" or "Deep Dive: NVDA"
 */
export function buildDisplayLabel(card: ActionCard, input?: string): string {
  if (input) {
    return `${card.title}: ${input.toUpperCase()}`;
  }
  return card.title;
}

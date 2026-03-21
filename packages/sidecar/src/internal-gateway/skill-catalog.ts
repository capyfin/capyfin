import type { BundledSkillEntry } from "./skill-bootstrap.ts";

/**
 * Maps finance skill IDs to their domain grouping for the catalog table.
 * Skills not in this map are placed under "Other".
 */
const SKILL_DOMAIN_MAP: Record<string, string> = {
  "morning-brief": "Daily Intelligence",
  "market-health": "Daily Intelligence",
  "deep-dive": "Company Research",
  "fair-value": "Company Research",
  "earnings-xray": "Company Research",
  "bull-bear": "Company Research",
  "breakout-setups": "Setup Screening",
  "earnings-momentum": "Setup Screening",
  "smart-money": "Institutional",
  "income-finder": "Income",
};

/**
 * Build a lightweight skill catalog (~20 lines of markdown) for inclusion
 * in the agent system prompt.  The catalog lets the agent discover and
 * invoke skills during freeform chat.
 *
 * Returns an empty string when no skills are provided.
 */
export function buildSkillCatalog(skills: BundledSkillEntry[]): string {
  if (skills.length === 0) {
    return "";
  }

  const financeSkills = skills.filter((s) => s.category === "finance");
  const personas = skills.filter((s) => s.category === "personas");

  if (financeSkills.length === 0 && personas.length === 0) {
    return "";
  }

  // Group finance skills by domain
  const domainGroups = new Map<string, string[]>();
  for (const skill of financeSkills) {
    const domain = SKILL_DOMAIN_MAP[skill.id] ?? "Other";
    const group = domainGroups.get(domain) ?? [];
    group.push(skill.id);
    domainGroups.set(domain, group);
  }

  const lines: string[] = [
    "",
    "## Available Financial Skills",
    "",
    "You have financial skills at `./skills/finance/` and analyst personas at `./skills/personas/`.",
    "When a conversation topic matches a skill domain, read the relevant SKILL.md before responding.",
    "",
  ];

  if (domainGroups.size > 0) {
    lines.push("| Domain | Skills |");
    lines.push("| --- | --- |");
    for (const [domain, ids] of domainGroups) {
      lines.push(`| ${domain} | ${ids.join(", ")} |`);
    }
    lines.push("");
  }

  if (personas.length > 0) {
    lines.push(
      `Personas: ${personas.map((p) => p.id).join(", ")}`,
    );
    lines.push("");
  }

  return lines.join("\n");
}

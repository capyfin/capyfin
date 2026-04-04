import type { CardOutput, CreateCaseRequest } from "@capyfin/contracts";

/**
 * Check whether a CardOutput represents a Deep Dive that should create an
 * Investment Case. Requires `cardId === "deep-dive"` and a `subject` (ticker).
 */
export function isDeepDiveOutput(cardOutput: CardOutput): boolean {
  return cardOutput.cardId === "deep-dive" && Boolean(cardOutput.subject);
}

/**
 * Map a Deep Dive CardOutput to a CreateCaseRequest suitable for
 * `sidecarClient.createCase()`.
 *
 * Returns `null` if the output is not a valid deep-dive with a subject.
 */
export function mapCardOutputToCase(
  cardOutput: CardOutput,
): CreateCaseRequest | null {
  if (!isDeepDiveOutput(cardOutput) || !cardOutput.subject) {
    return null;
  }

  return {
    ticker: cardOutput.subject,
    companyName: cardOutput.companyName ?? cardOutput.subject,
    stance: cardOutput.stance ?? "watching",
    confidence: cardOutput.confidence ?? deriveConfidence(cardOutput),
    sections: cardOutput.sections.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      confidence: s.confidence,
      citations: s.citations,
    })),
    keyAssumptions: cardOutput.keyAssumptions ?? [],
    invalidationSignals:
      cardOutput.invalidationSignals ??
      (cardOutput.keyRisks.length > 0 ? cardOutput.keyRisks : []),
    nextActions: cardOutput.followUps ?? [],
    tags: ["deep-dive"],
  };
}

/**
 * Derive an overall confidence from the sections when the top-level
 * `confidence` field is not set.
 */
function deriveConfidence(cardOutput: CardOutput): "HIGH" | "MEDIUM" | "LOW" {
  if (cardOutput.sections.length === 0) {
    return "MEDIUM";
  }

  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const section of cardOutput.sections) {
    counts[section.confidence]++;
  }

  if (counts.HIGH >= counts.MEDIUM && counts.HIGH >= counts.LOW) {
    return "HIGH";
  }
  if (counts.LOW >= counts.MEDIUM) {
    return "LOW";
  }
  return "MEDIUM";
}

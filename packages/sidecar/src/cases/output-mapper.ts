import type {
  CardOutput,
  Confidence,
  CreateCaseRequest,
  UpdateCaseRequest,
} from "@capyfin/contracts";

type WorkflowType = "deep-dive" | "position-review" | "earnings-xray";

/**
 * Map a CardOutput to a CreateCaseRequest for new case creation.
 * The cardOutput.subject is used as the ticker.
 */
export function cardOutputToCreateRequest(
  cardOutput: CardOutput,
): CreateCaseRequest {
  return {
    ticker: cardOutput.subject ?? "",
    companyName: cardOutput.companyName ?? cardOutput.subject ?? "",
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
 * Map a CardOutput to update fields for an existing case.
 * For earnings-xray, only sections are extracted (not stance/confidence).
 */
export function cardOutputToUpdateFields(
  cardOutput: CardOutput,
  workflowType: WorkflowType,
): UpdateCaseRequest {
  const sections = cardOutput.sections.map((s) => ({
    id: s.id,
    title: s.title,
    content: s.content,
    confidence: s.confidence,
    citations: s.citations,
  }));

  if (workflowType === "earnings-xray") {
    return {
      lastReviewedAt: new Date().toISOString(),
      sections,
      tags: ["earnings-xray"],
    };
  }

  return {
    stance: cardOutput.stance ?? undefined,
    confidence: cardOutput.confidence ?? deriveConfidence(cardOutput),
    lastReviewedAt: new Date().toISOString(),
    sections,
    keyAssumptions: cardOutput.keyAssumptions ?? [],
    invalidationSignals:
      cardOutput.invalidationSignals ??
      (cardOutput.keyRisks.length > 0 ? cardOutput.keyRisks : []),
    nextActions: cardOutput.followUps ?? [],
    tags: [workflowType],
  };
}

/**
 * Derive an overall confidence from the sections when the top-level
 * confidence field is not set.
 */
export function deriveConfidence(cardOutput: CardOutput): Confidence {
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

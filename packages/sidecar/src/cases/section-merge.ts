import type { CaseSection } from "@capyfin/contracts";

/**
 * Merge incoming sections into existing sections using case-insensitive
 * title matching. If an incoming section's title matches an existing one,
 * update its content, confidence, and citations while preserving the
 * existing section's ID. Otherwise, append the incoming section.
 */
export function mergeSections(
  existing: CaseSection[],
  incoming: CaseSection[],
): CaseSection[] {
  const result = existing.map((s) => ({ ...s }));
  const matchedIndices = new Set<number>();

  for (const incomingSection of incoming) {
    const normalizedTitle = incomingSection.title.toLowerCase();
    const existingIndex = result.findIndex(
      (s) => s.title.toLowerCase() === normalizedTitle,
    );

    if (existingIndex !== -1) {
      matchedIndices.add(existingIndex);
      const existing = result[existingIndex];
      if (!existing) continue;
      result[existingIndex] = {
        ...existing,
        content: incomingSection.content,
        confidence: incomingSection.confidence,
        citations: incomingSection.citations,
      };
    } else {
      result.push(incomingSection);
    }
  }

  return result;
}

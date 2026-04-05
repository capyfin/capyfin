import { randomUUID } from "node:crypto";
import type {
  AttentionItem,
  AttentionState,
  InvestmentCase,
  Urgency,
} from "@capyfin/contracts";

function mapUrgency(state: AttentionState): Urgency {
  switch (state) {
    case "review-now":
    case "drift-detected":
      return "high";
    case "stale":
    case "catalyst-upcoming":
      return "medium";
    case "review-soon":
      return "low";
    default:
      return "low";
  }
}

function daysBetween(date1: Date, date2: Date): number {
  const ms = date2.getTime() - date1.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function generateReason(
  investmentCase: InvestmentCase,
  state: AttentionState,
): string {
  const { ticker, lastReviewedAt, nextCatalystDescription, nextCatalystDate } =
    investmentCase;
  const days = daysBetween(new Date(lastReviewedAt), new Date());

  switch (state) {
    case "review-now":
      return `${ticker} has not been reviewed in ${String(days)} days and needs immediate review`;
    case "drift-detected":
      return `${ticker} has unresolved thesis drift`;
    case "stale":
      return `${ticker} has not been reviewed in ${String(days)} days`;
    case "catalyst-upcoming": {
      const desc = nextCatalystDescription ?? "upcoming catalyst";
      if (nextCatalystDate) {
        const daysUntil = daysBetween(new Date(), new Date(nextCatalystDate));
        return `${ticker} has an upcoming catalyst: ${desc} in ${String(daysUntil)} days`;
      }
      return `${ticker} has an upcoming catalyst: ${desc}`;
    }
    case "review-soon":
      return `${ticker} is approaching review threshold (${String(days)} days since last review)`;
    default:
      return `${ticker} needs attention`;
  }
}

export function scanCases(
  cases: InvestmentCase[],
  existingItems: AttentionItem[],
): AttentionItem[] {
  const result: AttentionItem[] = [];

  // Index existing items by caseId for fast lookup
  const existingByCaseId = new Map<string, AttentionItem[]>();
  for (const item of existingItems) {
    const list = existingByCaseId.get(item.caseId) ?? [];
    list.push(item);
    existingByCaseId.set(item.caseId, list);
  }

  // Track which case IDs are in the current scan
  const scannedCaseIds = new Set<string>();

  for (const c of cases) {
    if (!c.monitoringEnabled) continue;

    scannedCaseIds.add(c.id);
    const state = c.attentionState ?? "healthy";
    const caseItems = existingByCaseId.get(c.id) ?? [];

    if (state === "healthy") {
      // Condition resolved — remove all items for this case
      continue;
    }

    // Check if an existing item matches current caseId + attentionState
    const matchingItem = caseItems.find((i) => i.attentionState === state);

    if (matchingItem) {
      // Keep existing item (preserve original detection time)
      result.push(matchingItem);
    } else {
      // Create new item (state transition or first detection)
      result.push({
        id: randomUUID(),
        caseId: c.id,
        ticker: c.ticker,
        companyName: c.companyName,
        reason: generateReason(c, state),
        urgency: mapUrgency(state),
        attentionState: state,
        detectedAt: new Date().toISOString(),
        dismissed: false,
      });
    }
  }

  // Retain items for cases that were not in this scan (unmonitored cases
  // shouldn't lose existing items) — except we don't, because unmonitored
  // cases are skipped. Existing items for non-scanned cases are preserved
  // only if they belong to cases not in the input list at all.
  for (const [caseId, items] of existingByCaseId) {
    if (!scannedCaseIds.has(caseId)) {
      // Case not in scan (maybe deleted or not loaded) — keep existing items
      result.push(...items);
    }
  }

  return result;
}

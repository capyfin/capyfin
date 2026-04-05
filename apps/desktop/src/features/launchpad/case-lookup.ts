import type {
  AttentionState,
  CaseStance,
  Confidence,
  InvestmentCase,
} from "@capyfin/contracts";
import { daysBetween } from "./attention-utils";

export interface CaseStatus {
  hasCase: boolean;
  caseId?: string;
  ticker: string;
  stance?: CaseStance;
  confidence?: Confidence;
  daysSinceReview?: number;
  isStale: boolean;
  isLowConfidence: boolean;
  attentionState?: AttentionState | undefined;
  nextCatalystDate?: string | undefined;
  nextCatalystDescription?: string | undefined;
}

/**
 * Build a case-insensitive ticker→InvestmentCase map.
 * If duplicate tickers exist, keeps the most recently reviewed.
 */
export function buildCaseMap(
  cases: InvestmentCase[],
): Map<string, InvestmentCase> {
  const map = new Map<string, InvestmentCase>();
  for (const c of cases) {
    const key = c.ticker.toUpperCase();
    const existing = map.get(key);
    if (
      !existing ||
      new Date(c.lastReviewedAt).getTime() >
        new Date(existing.lastReviewedAt).getTime()
    ) {
      map.set(key, c);
    }
  }
  return map;
}

/**
 * Compute the case status for a given ticker against a pre-built case map.
 */
export function getCaseStatus(
  ticker: string,
  caseMap: Map<string, InvestmentCase>,
  stalenessThreshold = 30,
  now = new Date(),
): CaseStatus {
  const key = ticker.toUpperCase();
  const investmentCase = caseMap.get(key);

  if (!investmentCase) {
    return {
      hasCase: false,
      ticker: key,
      isStale: false,
      isLowConfidence: false,
    };
  }

  const daysSinceReview = daysBetween(investmentCase.lastReviewedAt, now);

  return {
    hasCase: true,
    caseId: investmentCase.id,
    ticker: key,
    stance: investmentCase.stance,
    confidence: investmentCase.confidence,
    daysSinceReview,
    isStale: daysSinceReview >= stalenessThreshold,
    isLowConfidence: investmentCase.confidence === "LOW",
    attentionState: investmentCase.attentionState,
    nextCatalystDate: investmentCase.nextCatalystDate,
    nextCatalystDescription: investmentCase.nextCatalystDescription,
  };
}

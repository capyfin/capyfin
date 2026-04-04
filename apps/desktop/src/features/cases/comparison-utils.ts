import type {
  InvestmentCase,
  CaseSection,
  CaseStance,
  Confidence,
} from "@capyfin/contracts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChangeClassification =
  | "same"
  | "improved"
  | "degraded"
  | "new"
  | "removed";

export interface AlignedSection {
  sectionId: string;
  title: string;
  left: CaseSection | null;
  right: CaseSection | null;
}

export interface ComparisonResult {
  leftStance: CaseStance;
  rightStance: CaseStance;
  leftConfidence: Confidence;
  rightConfidence: Confidence;
  stanceChange: ChangeClassification;
  confidenceChange: ChangeClassification;
  sharedAssumptions: string[];
  leftOnlyAssumptions: string[];
  rightOnlyAssumptions: string[];
  sharedRisks: string[];
  leftOnlyRisks: string[];
  rightOnlyRisks: string[];
  alignedSections: AlignedSection[];
}

export interface PriorComparisonResult {
  currentStance: CaseStance;
  currentConfidence: Confidence;
  priorStance: CaseStance | undefined;
  priorConfidence: Confidence | undefined;
  stanceChange: ChangeClassification;
  confidenceChange: ChangeClassification;
  historySummary: string;
  historyDate: string;
}

// ---------------------------------------------------------------------------
// classifyChange
// ---------------------------------------------------------------------------

const STANCE_ORDER: Record<CaseStance, number> = {
  bearish: 0,
  watching: 1,
  neutral: 2,
  bullish: 3,
};

const CONFIDENCE_ORDER: Record<Confidence, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

export function classifyChange(
  field: string,
  leftVal: string | undefined,
  rightVal: string | undefined,
): ChangeClassification {
  if (leftVal === undefined && rightVal !== undefined) return "new";
  if (leftVal !== undefined && rightVal === undefined) return "removed";
  if (leftVal === rightVal) return "same";

  const orderMap = field === "confidence" ? CONFIDENCE_ORDER : STANCE_ORDER;
  const leftRank = orderMap[leftVal as keyof typeof orderMap];
  const rightRank = orderMap[rightVal as keyof typeof orderMap];

  return rightRank > leftRank ? "improved" : "degraded";
}

// ---------------------------------------------------------------------------
// alignSections
// ---------------------------------------------------------------------------

const SECTION_ORDER = [
  "thesis",
  "valuation",
  "risks",
  "catalysts",
  "whatChanged",
];

export function alignSections(
  left: InvestmentCase,
  right: InvestmentCase,
): AlignedSection[] {
  const leftMap = new Map(left.sections.map((s) => [s.id, s]));
  const rightMap = new Map(right.sections.map((s) => [s.id, s]));

  const allIds = new Set([...leftMap.keys(), ...rightMap.keys()]);
  const sortedIds = [...allIds].sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a);
    const bi = SECTION_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return sortedIds.map((id) => {
    const leftSection = leftMap.get(id) ?? null;
    const rightSection = rightMap.get(id) ?? null;
    const title = leftSection?.title ?? rightSection?.title ?? id;
    return { sectionId: id, title, left: leftSection, right: rightSection };
  });
}

// ---------------------------------------------------------------------------
// computeDifferences
// ---------------------------------------------------------------------------

export function computeDifferences(
  left: InvestmentCase,
  right: InvestmentCase,
): ComparisonResult {
  const leftAssumptions = new Set(left.keyAssumptions);
  const rightAssumptions = new Set(right.keyAssumptions);
  const sharedAssumptions = left.keyAssumptions.filter((a) =>
    rightAssumptions.has(a),
  );
  const leftOnlyAssumptions = left.keyAssumptions.filter(
    (a) => !rightAssumptions.has(a),
  );
  const rightOnlyAssumptions = right.keyAssumptions.filter(
    (a) => !leftAssumptions.has(a),
  );

  const leftRisks = new Set(left.invalidationSignals);
  const rightRisks = new Set(right.invalidationSignals);
  const sharedRisks = left.invalidationSignals.filter((r) => rightRisks.has(r));
  const leftOnlyRisks = left.invalidationSignals.filter(
    (r) => !rightRisks.has(r),
  );
  const rightOnlyRisks = right.invalidationSignals.filter(
    (r) => !leftRisks.has(r),
  );

  return {
    leftStance: left.stance,
    rightStance: right.stance,
    leftConfidence: left.confidence,
    rightConfidence: right.confidence,
    stanceChange: classifyChange("stance", left.stance, right.stance),
    confidenceChange: classifyChange(
      "confidence",
      left.confidence,
      right.confidence,
    ),
    sharedAssumptions,
    leftOnlyAssumptions,
    rightOnlyAssumptions,
    sharedRisks,
    leftOnlyRisks,
    rightOnlyRisks,
    alignedSections: alignSections(left, right),
  };
}

// ---------------------------------------------------------------------------
// computePriorComparison
// ---------------------------------------------------------------------------

export function computePriorComparison(
  currentCase: InvestmentCase,
): PriorComparisonResult | null {
  if (currentCase.history.length === 0) return null;

  // Use the most recent history entry (last in array)
  const latest = currentCase.history[currentCase.history.length - 1];
  if (!latest) return null;

  const priorStance = latest.priorStance;
  const priorConfidence = latest.priorConfidence;

  return {
    currentStance: currentCase.stance,
    currentConfidence: currentCase.confidence,
    priorStance,
    priorConfidence,
    stanceChange: classifyChange("stance", priorStance, currentCase.stance),
    confidenceChange: classifyChange(
      "confidence",
      priorConfidence,
      currentCase.confidence,
    ),
    historySummary: latest.summary,
    historyDate: latest.date,
  };
}

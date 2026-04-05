import type {
  AttentionItem,
  AttentionState,
  InvestmentCase,
} from "@capyfin/contracts";

export interface AttentionBullet {
  category: AttentionState | "review-queue";
  message: string;
  urgency: "high" | "medium" | "low";
}

export interface RecentUpdate {
  ticker: string;
  companyName: string;
  caseId: string;
  eventType: string;
  summary: string;
  date: string;
}

export interface UpcomingCatalyst {
  ticker: string;
  companyName: string;
  caseId: string;
  description: string;
  date: string;
  daysUntil: number;
}

const URGENCY_MAP: Record<string, "high" | "medium" | "low"> = {
  "review-now": "high",
  "drift-detected": "high",
  stale: "medium",
  "catalyst-upcoming": "medium",
  "review-soon": "low",
};

const LABEL_MAP: Record<string, (count: number) => string> = {
  "review-now": (n) =>
    `${String(n)} ${n === 1 ? "case needs" : "cases need"} review now`,
  "drift-detected": (n) =>
    `${String(n)} ${n === 1 ? "holding shows" : "holdings show"} thesis drift`,
  stale: (n) => `${String(n)} ${n === 1 ? "case is" : "cases are"} stale`,
  "catalyst-upcoming": (n) =>
    `${String(n)} upcoming ${n === 1 ? "catalyst" : "catalysts"} this week`,
  "review-soon": (n) =>
    `${String(n)} ${n === 1 ? "case" : "cases"} to review soon`,
};

const CATEGORY_ORDER: (AttentionState | "review-queue")[] = [
  "review-now",
  "drift-detected",
  "stale",
  "catalyst-upcoming",
  "review-soon",
  "review-queue",
];

export function buildAttentionBullets(
  items: AttentionItem[],
  reviewQueueCount: number,
): AttentionBullet[] {
  const active = items.filter((i) => !i.dismissed);

  const counts = new Map<string, number>();
  for (const item of active) {
    const state = item.attentionState;
    if (state === "healthy") continue;
    counts.set(state, (counts.get(state) ?? 0) + 1);
  }

  const bullets: AttentionBullet[] = [];

  for (const category of CATEGORY_ORDER) {
    if (bullets.length >= 5) break;

    if (category === "review-queue") {
      if (reviewQueueCount > 0) {
        bullets.push({
          category: "review-queue",
          message: `${String(reviewQueueCount)} ${reviewQueueCount === 1 ? "name" : "names"} in your review queue`,
          urgency: "low",
        });
      }
      continue;
    }

    const count = counts.get(category);
    if (!count) continue;

    const labelFn = LABEL_MAP[category];
    if (!labelFn) continue;

    bullets.push({
      category,
      message: labelFn(count),
      urgency: URGENCY_MAP[category] ?? "low",
    });
  }

  return bullets;
}

export function buildRecentUpdates(
  cases: InvestmentCase[],
  limit = 10,
): RecentUpdate[] {
  const all: RecentUpdate[] = [];

  for (const c of cases) {
    for (const h of c.history) {
      all.push({
        ticker: c.ticker,
        companyName: c.companyName,
        caseId: c.id,
        eventType: h.eventType,
        summary: h.summary,
        date: h.date,
      });
    }
  }

  all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return all.slice(0, limit);
}

export function buildUpcomingCatalysts(
  cases: InvestmentCase[],
  now = new Date(),
): UpcomingCatalyst[] {
  const catalysts: UpcomingCatalyst[] = [];
  const cutoff = 14;

  for (const c of cases) {
    if (!c.nextCatalystDate) continue;

    const catalystDate = new Date(c.nextCatalystDate);
    const diffMs = catalystDate.getTime() - now.getTime();
    const daysUntil = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysUntil < 0 || daysUntil > cutoff) continue;

    catalysts.push({
      ticker: c.ticker,
      companyName: c.companyName,
      caseId: c.id,
      description: c.nextCatalystDescription ?? "Upcoming catalyst",
      date: c.nextCatalystDate,
      daysUntil,
    });
  }

  catalysts.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return catalysts;
}

import type { ActionCard, CardSection } from "./types";

export const actionCards: ActionCard[] = [
  {
    id: "morning-brief",
    title: "Morning Brief",
    promise:
      "Your daily market briefing — indices, watchlist, earnings calendar, regime",
    icon: "Newspaper",
    category: "today",
    input: "none",
    skills: ["morning-brief"],
    persona: "macro-analyst",
    prompt:
      "Generate a morning market briefing covering: market regime assessment, index performance, watchlist moves (if watchlist exists), notable earnings this week, sector rotation signals, and 3-5 key news items with impact assessment.",
    schedulable: true,
  },
  {
    id: "market-health",
    title: "Market Health",
    promise:
      "Bull or bear? Distribution days, breadth, sector rotation, regime score",
    icon: "Activity",
    category: "today",
    input: "none",
    skills: ["market-health"],
    persona: "macro-analyst",
    prompt:
      "Assess current market health using distribution day analysis, breadth indicators, and sector rotation. Produce a regime verdict (Confirmed Uptrend / Uptrend Under Pressure / Rally Attempt / Downtrend), composite score (0-100), and exposure guidance.",
  },
  {
    id: "deep-dive",
    title: "Deep Dive",
    promise:
      "SEC filings, competitive moat, financials, risks — the full picture",
    icon: "Search",
    category: "research",
    input: "ticker",
    skills: ["deep-dive"],
    persona: "fundamental-analyst",
    prompt:
      "Perform a comprehensive deep dive analysis of {ticker}. Cover business model, moat assessment (5-dimension framework), financial health (5-year trends), recent developments (last 90 days), key risks, and a final verdict with confidence level.",
  },
  {
    id: "fair-value",
    title: "Fair Value",
    promise: "DCF, comparables, analyst targets — is it cheap or rich?",
    icon: "Calculator",
    category: "research",
    input: "ticker",
    skills: ["fair-value"],
    persona: "fundamental-analyst",
    prompt:
      "Estimate the fair value of {ticker}. Build a DCF model (5-year projection with sensitivity table), compare multiples to peers, gather analyst price targets, and provide a valuation verdict.",
  },
];

export const cardSections: CardSection[] = [
  {
    id: "today",
    title: "Today",
    cards: actionCards.filter((c) => c.category === "today"),
  },
  {
    id: "research",
    title: "Research",
    cards: actionCards.filter((c) => c.category === "research"),
  },
];

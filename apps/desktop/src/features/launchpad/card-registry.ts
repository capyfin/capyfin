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
    prompt: "Run morning brief",
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
    prompt: "Run market health check",
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
    prompt: "Run deep dive on {ticker}",
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
    prompt: "Run fair value analysis on {ticker}",
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

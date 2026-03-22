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
  {
    id: "earnings-xray",
    title: "Earnings X-Ray",
    promise: "Beat or miss? Guidance quality? Post-earnings drift score?",
    icon: "FileBarChart",
    category: "research",
    input: "ticker",
    skills: ["earnings-xray"],
    persona: "fundamental-analyst",
    prompt:
      "Analyze the most recent earnings for {ticker}. If earnings have been reported, cover revenue and EPS vs. estimates, guidance quality, segment performance, management tone (key quotes), post-earnings price action, and assign a Drift Score (A-F). If earnings are upcoming, provide consensus estimates, historical beat/miss pattern (last 4 quarters), key metrics to watch, and implied move.",
  },
  {
    id: "bull-bear",
    title: "Bull / Bear",
    promise:
      "Strongest arguments for and against — sourced, structured, no bias",
    icon: "Scale",
    category: "research",
    input: "ticker",
    skills: ["bull-bear"],
    persona: "fundamental-analyst",
    prompt:
      "Build the strongest bull and bear cases for {ticker}. Produce exactly 3 bull arguments and 3 bear arguments, each citing specific evidence (data points, filing sections, metrics) and naming the key risk that invalidates it. Identify the single key swing factor that determines which thesis wins. State your verdict with the explicit assumption behind it.",
  },
  {
    id: "breakout-setups",
    title: "Breakout Setups",
    promise:
      "VCP patterns, base breakouts, Stage 2 uptrend candidates — scored 0-100",
    icon: "TrendingUp",
    category: "setups",
    input: "none",
    skills: ["breakout-setups"],
    persona: "technical-analyst",
    prompt:
      "Scan for high-quality breakout setups: VCP patterns, cup-and-handle formations, flat bases, and ascending bases. Score each candidate 0-100 using the VCP criteria framework. Present a table of 5-10 candidates with ticker, pattern type, score, current price vs. pivot point, volume profile, sector, and stage. Include invalidation levels for each setup.",
    tier0Override: {
      input: "tickers",
      prompt:
        "Analyze the following tickers for breakout setups: {tickers}. For each ticker evaluate VCP patterns, cup-and-handle formations, flat bases, and ascending bases. Score each candidate 0-100 using the VCP criteria framework. Present a table with ticker, pattern type, score, current price vs. pivot point, volume profile, sector, and stage. Include invalidation levels for each setup.\n\n💡 Connect FMP in Settings → Providers to unlock full market scanning with the screener API. It's free.",
    },
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
  {
    id: "setups",
    title: "Find Setups",
    cards: actionCards.filter((c) => c.category === "setups"),
  },
];

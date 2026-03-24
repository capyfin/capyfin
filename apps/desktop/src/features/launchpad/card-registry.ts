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
    estimatedDuration: "fast",
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
    estimatedDuration: "fast",
    skills: ["market-health"],
    persona: "macro-analyst",
    prompt:
      "Assess current market health using distribution day analysis, breadth indicators, and sector rotation. Produce a regime verdict (Confirmed Uptrend / Uptrend Under Pressure / Rally Attempt / Downtrend), composite score (0-100), and exposure guidance.",
    schedulable: true,
  },
  {
    id: "deep-dive",
    title: "Deep Dive",
    promise:
      "SEC filings, competitive moat, financials, risks — the full picture",
    icon: "Search",
    category: "research",
    input: "ticker",
    estimatedDuration: "deep",
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
    estimatedDuration: "medium",
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
    estimatedDuration: "medium",
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
    estimatedDuration: "medium",
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
    estimatedDuration: "medium",
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
  {
    id: "earnings-momentum",
    title: "Earnings Momentum",
    promise: "Post-earnings drift candidates showing accumulation after a beat",
    icon: "Zap",
    category: "setups",
    input: "none",
    estimatedDuration: "medium",
    skills: ["earnings-momentum"],
    persona: "technical-analyst",
    prompt:
      "Scan for post-earnings drift candidates: stocks that beat earnings estimates and are showing accumulation (rising volume, institutional buying) in the days/weeks following the report. Rank by drift potential using earnings surprise magnitude, volume confirmation, relative strength, and institutional activity. Present a table of 5-10 candidates with ticker, earnings date, EPS surprise %, revenue surprise %, post-earnings volume ratio, price change since report, RS rating, and drift score (0-100). Include entry zones and stop levels.",
    tier0Override: {
      input: "tickers",
      prompt:
        "Analyze the following tickers for post-earnings drift potential: {tickers}. For each ticker evaluate earnings surprise magnitude, post-earnings volume confirmation, relative strength, and institutional accumulation patterns. Rank by drift potential and present a table with ticker, earnings date, EPS surprise %, revenue surprise %, post-earnings volume ratio, price change since report, RS rating, and drift score (0-100). Include entry zones and stop levels.\n\n💡 Connect FMP in Settings → Providers to unlock full market scanning with the screener API. It's free.",
    },
  },
  {
    id: "smart-money",
    title: "Smart Money",
    promise:
      "Insider buying clusters, institutional changes, and unusual accumulation",
    icon: "Eye",
    category: "setups",
    input: "none",
    estimatedDuration: "medium",
    skills: ["smart-money"],
    persona: "fundamental-analyst",
    prompt:
      "Scan for smart money signals: insider buying clusters (multiple insiders buying within 30 days), significant institutional ownership changes (13F filings), and unusual accumulation patterns (volume spikes with price stability). Present an ownership flow report with 5-10 candidates showing ticker, insider transaction summary, institutional ownership change, unusual volume signals, sector, market cap, and a conviction score (0-100). Highlight cluster buys where 3+ insiders purchased within the same window.",
    tier0Override: {
      input: "ticker",
      prompt:
        "Analyze smart money activity for {ticker}. Cover insider buying/selling activity (last 90 days), institutional ownership changes (recent 13F filings), and unusual accumulation or distribution patterns. Present an ownership flow report with insider transaction details, institutional holder changes, volume analysis, and a conviction score (0-100). Highlight any cluster buys or significant position changes.\n\n💡 Connect FMP in Settings → Providers to unlock full market scanning with the screener API. It's free.",
    },
  },
];

export const portfolioCards: ActionCard[] = [
  {
    id: "portfolio-analysis",
    title: "Portfolio Analysis",
    promise:
      "Allocation check, concentration risks, regime-adjusted exposure guidance",
    icon: "BarChart3",
    category: "portfolio",
    input: "none",
    estimatedDuration: "medium",
    skills: [],
    persona: "macro-analyst",
    prompt:
      "Analyze my portfolio for allocation balance, concentration risks, sector tilts, and regime-adjusted exposure. Read portfolio.csv for the current holdings. Provide a structured report with allocation summary, concentration alerts (any position >20% or sector >40%), diversification score, and specific rebalancing suggestions.",
  },
  {
    id: "position-review",
    title: "Position Review",
    promise:
      "Re-underwrite a specific holding — is the original thesis still intact?",
    icon: "Search",
    category: "portfolio",
    input: "ticker",
    estimatedDuration: "deep",
    skills: ["deep-dive"],
    persona: "fundamental-analyst",
    prompt:
      "Review my position in {ticker} from my portfolio. Read portfolio.csv for context on my cost basis and allocation. Assess whether the original investment thesis still holds, flag any new risks or catalysts, and recommend whether to hold, add, trim, or exit. Include current valuation context.",
  },
  {
    id: "benchmark-comparison",
    title: "Compare Against Benchmark",
    promise:
      "Portfolio vs S&P 500 / custom benchmark — tracking error, factor exposure",
    icon: "GitCompareArrows",
    category: "portfolio",
    input: "none",
    estimatedDuration: "medium",
    skills: [],
    persona: "macro-analyst",
    prompt:
      "Compare my portfolio against the S&P 500 benchmark. Read portfolio.csv for my current holdings. Analyze sector over/underweights vs the benchmark, estimate tracking error, identify factor tilts (value/growth/size/momentum), and highlight the biggest sources of active risk. Suggest adjustments to better align with or intentionally diverge from the benchmark.",
  },
];

export const incomeCards: ActionCard[] = [
  {
    id: "income-finder",
    title: "Income Finder",
    promise:
      "Dividend growers on pullback, ranked by yield, safety, and growth",
    icon: "DollarSign",
    category: "income",
    input: "none",
    estimatedDuration: "medium",
    skills: ["income-finder"],
    persona: "income-analyst",
    prompt:
      "Scan for high-quality dividend income opportunities: dividend growers currently on pullback or trading near support. Rank candidates by a composite score combining dividend yield, payout safety (payout ratio, free cash flow coverage), dividend growth rate (5-year CAGR), and current technical setup (proximity to support, RSI). Present a table of 5-10 candidates with ticker, dividend yield, 5-year dividend growth rate, payout ratio, FCF coverage, years of consecutive increases, current price vs. 52-week range, and income score (0-100). Include ex-dividend dates where upcoming.",
    tier0Override: {
      input: "tickers",
      prompt:
        "Analyze the following tickers as income/dividend opportunities: {tickers}. For each ticker evaluate dividend yield, payout safety (payout ratio, free cash flow coverage), dividend growth rate (5-year CAGR), and current technical setup. Present a table with ticker, dividend yield, 5-year dividend growth rate, payout ratio, FCF coverage, years of consecutive increases, current price vs. 52-week range, and income score (0-100). Include ex-dividend dates where upcoming.\n\n💡 Connect FMP in Settings → Providers to unlock full market scanning with the screener API. It's free.",
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
  {
    id: "income",
    title: "Income",
    cards: incomeCards,
  },
  {
    id: "portfolio",
    title: "Portfolio",
    cards: portfolioCards,
  },
];

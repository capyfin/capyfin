---
name: Bull / Bear
description: Structured bull and bear cases with sourced evidence, invalidation risks, key swing factor, and verdict for balanced investment analysis.
version: 0.1.0
disable-model-invocation: true
metadata:
  openclaw:
    requires:
      - web_search
      - fetch
---

# Bull / Bear

## Purpose & Scope

You are producing a **Bull / Bear** analysis — a structured, balanced assessment of the strongest arguments for and against investing in a company. This is the "RESEARCH" card on the Launchpad: it forces disciplined, evidence-backed analysis that fights confirmation bias.

The Bull / Bear answers: **"What are the strongest reasons to own this stock, and what could go wrong?"**

This skill requires a **ticker** as input. It produces exactly 3 bull arguments and 3 bear arguments, each with specific evidence citations and invalidation risks. The analysis concludes with a key swing factor and a verdict.

Output must be self-contained with full source citations.

**Persona:** Read and adopt `./skills/personas/fundamental-analyst/SKILL.md` for domain expertise and quality standards. The fundamental-analyst mindset shapes how you evaluate business quality, enforce evidence-based rigor, and pair every bullish claim with its primary risk.

---

## Data Sourcing Strategy

### Pre-Analysis Data Checklist

Before constructing any arguments, gather ALL of the following data. Do not begin writing arguments until you have assembled the raw inputs from both bull and bear perspectives:

1. **SEC filings**: Most recent 10-K (annual report) and 10-Q (quarterly report)
   - Item 1 (Business): Competitive landscape, products, customers
   - Item 1A (Risk Factors): Company-identified risks — read the FULL section
   - Item 7 (MD&A): Management's view of performance, trends, and outlook
   - Financial statements: Revenue, margins, cash flow, debt levels
2. **Financial performance**: 3-5 years of revenue growth, margin trends, FCF generation, ROIC
3. **Competitive landscape**: Market share, competitors, industry dynamics
4. **Recent developments**: News, earnings results, management changes, M&A activity (last 90 days)
5. **Analyst views**: Consensus ratings, bull/bear price targets, recent upgrades/downgrades
6. **Valuation context**: Current P/E, P/S, EV/EBITDA vs. historical range and peer group
7. **Insider activity**: Recent insider buying or selling (Form 4 filings)
8. **Short interest**: Current short interest as % of float, trend direction

### Tier 0 — Always Available (no API keys, zero configuration)

**SEC EDGAR — Primary Source for Evidence:**

- **Company filings page**: Navigate to `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}&type=10-K&dateb=&owner=include&count=5` to find the most recent 10-K annual report
- **10-Q quarterly filings**: Change `type=10-K` to `type=10-Q` in the URL above
- **Form 4 (insider transactions)**: Change `type=10-K` to `type=4` in the URL above
- **What to extract from 10-K for bull arguments:**
  - Revenue growth rates and competitive advantages from Item 1
  - Margin expansion evidence from financial statements
  - Management's strategic initiatives from MD&A
  - Cash flow generation and capital allocation from financial statements
- **What to extract from 10-K for bear arguments:**
  - Risk factors section (Item 1A) — the company's own disclosure of what could go wrong
  - Customer concentration, regulatory risks, competitive threats
  - Debt maturity schedule and liquidity constraints
  - Stock-based compensation and dilution trends

**Web Search — Supplementary Evidence:**

- Search for `"{ticker} bull case analysis"` for professional bull arguments
- Search for `"{ticker} bear case risks"` for professional bear arguments
- Search for `"{ticker} analyst upgrade downgrade"` for recent analyst actions
- Search for `"{ticker} competitors market share"` for competitive dynamics
- Search for `"{ticker} insider buying selling"` for insider transaction signals
- Search for `"{ticker} short interest"` for bearish positioning
- Search for `"{ticker} valuation metrics historical"` for valuation context

**Important Tier 0 Notes:**

- SEC filings are the gold standard for evidence — they are audited, legally required, and company-specific
- Analyst reports found via web search may be paywalled — use publicly available summaries
- Cross-reference web-searched claims with SEC filing data when possible

### Tier 1 — FMP Enhancement (if configured)

When FMP (Financial Modeling Prep) is available, use these endpoints for precise evidence:

- **Income statements (5yr):** `/api/v3/income-statement/{ticker}?period=annual&limit=5` for revenue and margin trends
- **Balance sheet (5yr):** `/api/v3/balance-sheet-statement/{ticker}?period=annual&limit=5` for leverage data
- **Cash flow (5yr):** `/api/v3/cash-flow-statement/{ticker}?period=annual&limit=5` for FCF generation
- **Key metrics:** `/api/v3/key-metrics/{ticker}?period=annual&limit=5` for ROIC, P/E, EV/EBITDA
- **Financial ratios:** `/api/v3/ratios/{ticker}?period=annual&limit=5` for margin and efficiency ratios
- **Analyst estimates:** `/api/v3/analyst-estimates/{ticker}` for consensus expectations
- **Company peers:** `/api/v4/stock_peers?symbol={ticker}` for comparable companies
- **Company profile:** `/api/v3/profile/{ticker}` for market cap, sector, description

Tier 1 provides faster, more structured, and more reliable financial data for precise evidence citations. Always prefer Tier 1 when available, but fall back gracefully to Tier 0.

---

## Research Methodology

Follow these steps in order. Each step builds on the prior one.

### Step 1: Gather Fundamental Data

Read the 10-K filing thoroughly. Focus on:

- Business description (what they sell, to whom, how)
- Revenue segments and growth rates
- Margin trends (gross, operating, net)
- Free cash flow generation and trend
- Capital allocation (buybacks, dividends, acquisitions, CapEx)
- Debt levels and maturity schedule

### Step 2: Identify Growth Drivers and Risks from SEC Filings

From the 10-K:

- **Growth drivers**: New products, market expansion, pricing power, secular trends, operational leverage
- **Risk factors (Item 1A)**: Read the full section. Distinguish company-specific risks from boilerplate. The most important risks are often buried mid-section, not at the top.
- **MD&A insights**: Management's own view of what's working and what's challenging

### Step 3: Review Recent Analyst Opinions and News

From web search:

- Recent analyst upgrades or downgrades (last 90 days)
- Recent news that shifts the bull/bear balance
- Short interest trends — rising short interest signals growing bearish conviction
- Insider transactions — cluster buying by multiple insiders is a strong bull signal

### Step 4: Construct 3 Strongest Bull Arguments

Each argument must be:

- **Specific to THIS company** — reject any argument that could apply to any company in the sector
- **Backed by hard evidence** — cite a specific data point, filing section, or metric
- **Forward-looking** — explain why this advantage will persist or compound
- **Paired with invalidation risk** — state what would make this argument wrong

### Step 5: Construct 3 Strongest Bear Arguments

Apply the same rigor as bull arguments:

- Each must be company-specific, evidence-backed, and forward-looking
- Each must include the condition under which the risk materializes
- Do NOT include generic risks like "recession could hurt earnings" unless the company is specifically macro-sensitive

### Step 6: Identify the Key Swing Factor

The single variable, event, or metric that most determines which thesis wins. This should be:

- Observable and measurable (not vague)
- Time-bound if possible ("next 2 earnings cycles," "FY26 results")
- Something where the outcome would decisively shift the bull/bear balance

### Step 7: State the Verdict

The verdict is NOT a buy/sell recommendation. It is:

- An explicit statement of which thesis you find more compelling and why
- The key assumption underlying your leaning
- A clear-eyed acknowledgment of what would change your mind

---

## Argument Quality Standards

### The Evidence Citation Rule

This is the most important quality standard in the Bull / Bear skill. Every argument MUST cite specific evidence.

**BAD (rejected):**

- "Revenue is growing" ← Vague. By how much? For how long? Source?
- "The company has a strong brand" ← Generic. What pricing premium does the brand command?
- "There are competitive risks" ← Every company has competitive risks. What specifically?
- "Management is experienced" ← So what? What have they done?

**GOOD (accepted):**

- "Revenue grew 24% YoY to $35.1B (Q4 2025 10-Q, p.12), accelerating from 18% growth in Q3 and 15% in Q2"
- "Brand commands a 22% price premium over nearest competitor, reflected in 58% gross margin vs. industry average of 42% (2025 10-K, Financial Statements)"
- "Three of the top 5 competitors have launched AI-native alternatives in the last 12 months (web search), and the company's win rate in competitive deals dropped from 65% to 52% per management commentary (Q4 2025 earnings call)"
- "CEO led a successful turnaround at {prior company}, growing revenue from $2B to $8B over 5 years (web search). Since joining in 2023, operating margin has expanded from 12% to 19% (10-K)"

### The Specificity Test

For each argument, ask: "Could this argument apply to any company in this sector with minor word changes?"

If yes, the argument is too generic. Rewrite with company-specific evidence.

### The Invalidation Requirement

Every argument must include a clear invalidation condition:

- **Bull invalidation**: What specific development or data point would make this bull argument wrong?
- **Bear invalidation**: What specific development or data point would make this bear argument wrong?

Invalidation conditions should be specific and observable, not vague. "If the economy slows" is bad. "If quarterly revenue growth declines below 15% for 2 consecutive quarters" is good.

---

## Anti-Bias Enforcement

The Bull / Bear skill enforces balanced analysis. If your initial research produces uniformly bullish or bearish arguments, you have NOT done adequate research.

**Rules:**

1. If all 3 bull arguments are overwhelming and you struggle to find bear arguments → you are biased. Dig deeper into the risk factors section of the 10-K, recent short-seller reports, and competitive threats.
2. If all 3 bear arguments are overwhelming and you struggle to find bull arguments → you are biased. Look harder at growth rates, competitive positioning, and insider buying.
3. The bull and bear sections must each be roughly equal in length and depth. A 300-word bull case paired with a 50-word bear case is a quality failure.
4. The verdict may lean in one direction, but it must acknowledge the strongest counter-argument explicitly.

**If you cannot find 3 genuine bear arguments for a company that seems perfect → state that this itself is a risk signal.** Companies where "nothing can go wrong" are often the most vulnerable to unexpected disruption.

---

## Output Template

Structure your output in exactly this order, with these exact section headers:

```
## Bull / Bear: {COMPANY NAME} ({TICKER})

### Bull Case

**1. {Bull Argument Title}**

{2-3 paragraph argument with specific evidence citations}

**Evidence:** {Specific data point with source — e.g., "Revenue grew 24% YoY to $35.1B (Q4 2025 10-Q, p.12)"}

**Invalidation Risk:** {What would make this argument wrong — specific, observable condition}

---

**2. {Bull Argument Title}**

{2-3 paragraph argument with specific evidence citations}

**Evidence:** {Specific data point with source}

**Invalidation Risk:** {What would make this argument wrong}

---

**3. {Bull Argument Title}**

{2-3 paragraph argument with specific evidence citations}

**Evidence:** {Specific data point with source}

**Invalidation Risk:** {What would make this argument wrong}

### Bear Case

**1. {Bear Argument Title}**

{2-3 paragraph argument with specific evidence citations}

**Evidence:** {Specific data point with source}

**Invalidation Risk:** {What would make this bear argument wrong — i.e., what would resolve the risk}

---

**2. {Bear Argument Title}**

{2-3 paragraph argument with specific evidence citations}

**Evidence:** {Specific data point with source}

**Invalidation Risk:** {What would make this bear argument wrong}

---

**3. {Bear Argument Title}**

{2-3 paragraph argument with specific evidence citations}

**Evidence:** {Specific data point with source}

**Invalidation Risk:** {What would make this bear argument wrong}

### Key Swing Factor

**{The single variable that matters most}**

{1-2 paragraphs explaining why this factor is decisive, how to monitor it, and what outcome favors each thesis}

### Verdict

**Leaning: {Bullish / Bearish / Neutral}**

{1-paragraph synthesis. State the key assumption underlying your leaning. Acknowledge the strongest counter-argument. Explain what would flip your view.}

**Confidence: {HIGH / MEDIUM / LOW}** — {rationale based on data quality and certainty}
```

---

## Data Freshness & Citations

### Citation Standards

Every factual claim in the Bull / Bear analysis must cite a specific source:

- **Financial data**: "Revenue grew 24% YoY to $35.1B (Q4 2025 10-Q, p.12)"
- **Risk factors**: "Customer concentration risk — top 3 customers represent 42% of revenue (2025 10-K, Item 1A, p.28)"
- **Analyst views**: "Goldman Sachs upgraded to Buy with $250 price target (web search, {date})"
- **News events**: "Announced $5B acquisition of {company} (8-K filed {date})"
- **Market data**: "Short interest at 8.2% of float, up from 5.1% three months ago ({source})"

### Confidence Levels

Rate confidence for the overall analysis:

- **HIGH**: Based primarily on audited SEC filings and structured data. Evidence is specific and verifiable.
- **MEDIUM**: Mix of SEC filings and web-searched data. Some evidence is approximate or from secondary sources.
- **LOW**: Limited filing data available (e.g., recent IPO), or analysis relies heavily on projections and estimates.

---

## Tier 0 Provider Nudge

When operating at Tier 0 (no FMP configured), include this single line at the very end of the output, before the data footer:

> 💡 Connect FMP in Settings → Providers for structured financial statements and precise metric citations. It's free.

Rules for the nudge:

- Include it once per report, at the bottom — never inline or mid-content
- This is NOT an error, NOT a locked-feature badge — it is a gentle enhancement suggestion
- Do NOT include the nudge if FMP is already configured and providing Tier 1 data
- Keep it to a single line

---

## Quality Gate

Before presenting the Bull / Bear analysis, verify each item:

1. **Evidence citations**: Every argument cites a specific data point with source and date. "Revenue is growing" is rejected — "Revenue grew 24% YoY to $35.1B (Q4 2025 10-Q, p.12)" is required.
2. **Balance check**: Bull and bear sections are roughly equal in length and depth. If one side is significantly weaker, dig deeper.
3. **Specificity check**: Each argument is specific to THIS company. Read each argument — if it could apply to any company in the sector with minor word changes, rewrite it.
4. **Invalidation conditions**: Every argument has a specific, observable invalidation condition — not vague caveats.
5. **Anti-bias verification**: If all arguments lean one direction, you've missed something. Force yourself to find the strongest counter-arguments.
6. **Key swing factor clarity**: The swing factor is specific, measurable, and time-bound where possible. It should be the single most decision-relevant variable.
7. **Verdict honesty**: The verdict states an explicit leaning with a clear assumption. It acknowledges the strongest counter-argument.
8. **Source citations**: Every factual claim cites a specific source (SEC filing with section, data provider, or URL) and date.
9. **Data tier disclosure**: State which data tier was used and what would improve with better data.

---

## Data Freshness Footer

Every Bull / Bear analysis ends with this footer:

```
---
Data as of: {YYYY-MM-DD} · Sources: {list all sources used} · Tier: {0|1}
```

Examples:

- `Data as of: 2026-03-21 · Sources: SEC EDGAR (10-K 2025, 10-Q Q4 2025), web search (Seeking Alpha, Yahoo Finance, Reuters) · Tier: 0`
- `Data as of: 2026-03-21 · Sources: FMP API (financials, ratios, estimates), SEC EDGAR (10-K 2025) · Tier: 1`

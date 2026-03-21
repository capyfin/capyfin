---
name: Breakout Setups
description: VCP patterns, base breakouts, Stage 2 uptrend candidates scored 0-100 with volume and RS confirmation for technical setup screening.
version: 0.1.0
disable-model-invocation: true
metadata:
  openclaw:
    requires:
      - web_search
      - fetch
      - read_file
---

# Breakout Setups

## Purpose & Scope

You are producing a **Breakout Setups** scan — a systematic screen for stocks forming high-probability breakout patterns. This is the "FIND SETUPS" card on the Launchpad: it identifies actionable technical setups using pattern recognition and scoring.

The Breakout Setups answers: **"Which stocks are setting up for potential breakouts, and how strong are the patterns?"**

This skill scans for four pattern types: **VCP (Volatility Contraction Pattern)**, **cup-and-handle**, **flat base**, and **ascending base**. Each candidate is scored 0-100 using the methodology in `references/vcp-criteria.md`.

**Input behavior varies by data tier:**
- **Tier 1 (FMP configured):** No input required — the skill scans the market using screener APIs. Optional sector or market cap filters.
- **Tier 0 (no API keys):** The skill cannot scan the market. Input changes to **"Enter tickers to scan"** — the user provides specific tickers for pattern analysis.

Output must be self-contained with full source citations.

**Persona:** Read and adopt `./skills/personas/technical-analyst/SKILL.md` for domain expertise and quality standards. The technical-analyst mindset shapes how you evaluate price action, confirm patterns with volume, and enforce risk-defined setups.

---

## Data Sourcing Strategy

### Pre-Analysis Data Checklist

Before evaluating any setup, gather ALL of the following data for each candidate. Do not begin scoring until you have assembled the raw inputs:

1. **Price data**: Current price, 52-week high/low, distance from high
2. **Moving averages**: 50-day MA, 200-day MA, 10-week MA — current values and slopes
3. **Volume profile**: 50-day average volume, recent volume trend, volume on consolidation vs. prior advance
4. **Base characteristics**: Duration of consolidation (weeks), depth of correction from high (%), number of contractions
5. **Relative strength**: Performance vs. S&P 500 over 3-month and 6-month periods, RS line direction
6. **Pivot point**: The specific price level where a breakout would be confirmed
7. **Sector context**: Sector and industry group performance relative to the broad market

### Tier 0 — Limited Functionality (no API keys, zero configuration)

**IMPORTANT: At Tier 0, this skill cannot scan the market.** Web search alone cannot reliably screen thousands of stocks for technical patterns. The skill's functionality is limited to analyzing specific tickers provided by the user.

**Input change at Tier 0:** Instead of scanning the market, ask the user: "Enter tickers to scan for breakout setups (e.g., NVDA, AAPL, MSFT, AMZN)."

**Web Search — Per-Ticker Analysis:**

- Search for `"{ticker} stock chart technical analysis"` for pattern descriptions
- Search for `"{ticker} stock price 50-day 200-day moving average"` for MA positions
- Search for `"{ticker} stock volume analysis"` for volume profile
- Search for `"{ticker} relative strength S&P 500"` for RS comparison
- Search for `"{ticker} stock support resistance levels"` for pivot points
- Search for `"stock breakout setups {sector}"` for sector-level pattern scanning context

**Important Tier 0 Notes:**
- Web-searched technical data may be delayed by 15-20 minutes during market hours
- Chart pattern identification from web search descriptions is less reliable than direct price data analysis
- RS line data from web search is approximate — note the data quality limitation
- Maximum recommended tickers at Tier 0: 10 (to avoid excessive web searches)

### Tier 1 — FMP Enhancement (if configured)

When FMP (Financial Modeling Prep) is available, the skill unlocks systematic market scanning:

**Screener API — Finding Candidates:**

- **Stock screener:** `/api/v3/stock-screener?priceMoreThan=10&marketCapMoreThan=1000000000&volumeMoreThan=500000&exchange=NYSE,NASDAQ` to find liquid, institutional-grade stocks
- **Additional filters:**
  - Price above 200-day MA: filter candidates in Stage 2 uptrends
  - Sector filter: `/api/v3/stock-screener?sector={sector}` for sector-specific scans
  - Market cap filter: adjust `marketCapMoreThan` and `marketCapLessThan` for size preferences

**Per-Candidate Data:**

- **Historical prices:** `/api/v3/historical-price-full/{ticker}?timeseries=365` for 1 year of daily prices
- **Technical indicators:** `/api/v3/technical_indicator/daily/{ticker}?period=50&type=sma` for moving averages
- **Company profile:** `/api/v3/profile/{ticker}` for sector, industry, market cap
- **Quote:** `/api/v3/quote/{ticker}` for current price, volume, day range

Tier 1 enables systematic screening that is impossible at Tier 0. The screener can filter thousands of stocks down to 20-50 candidates, then detailed price/volume analysis identifies the best 5-10 setups.

---

## Tier 0 Behavior (Important)

When no FMP key is configured, the scanning capability is severely limited. Handle this clearly:

1. **State the limitation upfront**: "Operating at Tier 0 — unable to scan the market. Analyzing the {N} tickers you provided."
2. **Ask for tickers if none provided**: If the user triggers the skill without specifying tickers, ask: "I need specific tickers to analyze. Please enter 5-10 tickers you'd like me to evaluate for breakout setups."
3. **Quality caveat**: Note that Tier 0 analysis relies on web-searched price data, which may be delayed or approximate.
4. **Enhanced nudge**: Because Tier 0 is so limited for this skill, the provider nudge is slightly more prominent (but still not an error or locked feature).

---

## Scanning Methodology (Tier 1)

When FMP is available, follow this systematic screening process:

### Phase 1: Universe Filtering

Use the FMP screener to define the universe:

- **Price > $10** — eliminates penny stocks with unreliable patterns
- **Market cap > $1B** — ensures institutional liquidity
- **Average volume > 500,000 shares** — ensures adequate liquidity for pattern validity
- **Exchange: NYSE, NASDAQ** — US-listed stocks only
- **Optional user filters**: Sector, market cap range, minimum price

This typically produces 500-2,000 candidates.

### Phase 2: Stage 2 Uptrend Filter

From the universe, keep only stocks in a Stage 2 uptrend:

- Price above the 200-day MA
- 200-day MA slope is positive (rising for at least 1 month)
- Price above the 50-day MA (or within 3% of it during a constructive pullback)

This typically reduces candidates to 200-500 stocks.

### Phase 3: Base Pattern Detection

For remaining candidates, analyze the price action over the last 3-6 months to identify base patterns:

- Look for consolidation after a prior advance of at least 20%
- Measure the depth of the correction from the recent high
- Count the number of price contractions
- Measure contraction tightness (is each pullback tighter than the last?)

### Phase 4: Scoring and Ranking

Score each candidate 0-100 using the methodology in `references/vcp-criteria.md`. Select the top 5-10 setups for the output.

---

## Pattern Recognition

### VCP (Volatility Contraction Pattern)

The VCP is a base pattern where price contractions get progressively tighter, signaling that selling pressure is drying up and institutional accumulation is occurring.

**Characteristics:**
- **Successive contractions**: T1 (first pullback) is the deepest, T2 is tighter, T3 is tightest
- **Ideal depth progression**: T1: 25-35%, T2: 15-25%, T3: 8-15%
- **Minimum 2 contractions**, ideal 3-4 contractions
- **Volume declining** on the right side of the pattern — volume should be lowest near the pivot point
- **Duration**: Typically 3-12 weeks from first contraction to pivot
- **Pivot point**: The high of the last contraction — breakout above this level on increased volume confirms the pattern

**What to watch for:**
- Tight closes near the highs within the consolidation = bullish
- Wide and loose price swings within the base = bearish (not a valid VCP)

### Cup-and-Handle

A U-shaped base followed by a smaller pullback (the handle) before a breakout attempt.

**Characteristics:**
- **Cup**: U-shaped correction of 15-35% depth, lasting 6-65 weeks
- **Handle**: Small pullback of 5-15% on the right side of the cup, lasting 1-4 weeks
- **Volume**: Should dry up during the handle formation — this is the key confirmation signal
- **Pivot point**: The high of the handle — breakout above this level on volume surge confirms the pattern
- **Lip line**: The prior high (left side of the cup) — price approaching this level is the setup zone

**What disqualifies a cup-and-handle:**
- V-shaped recovery (not a cup — too sharp, indicates instability)
- Handle that declines more than 15% or lasts more than 4 weeks
- Handle forming in the lower half of the cup (weak)

### Flat Base

A tight consolidation pattern after a prior advance, indicating accumulation in a narrow price range.

**Characteristics:**
- **Duration**: Minimum 5 weeks of consolidation
- **Depth**: Less than 15% correction from high to low within the base
- **Tight price range**: Weekly closes cluster within a narrow band
- **Typically forms after a prior advance of 20%+** — it's a continuation pattern, not a bottom
- **Volume**: Should contract during the base, confirming sellers have been absorbed
- **Pivot point**: The high of the flat base — breakout above on volume confirms

**Why flat bases are powerful:**
- A stock that refuses to correct more than 15% after a significant advance is showing exceptional relative strength
- Institutions are holding (not selling), and new accumulation is occurring within the tight range

### Ascending Base

Three or more pullbacks to rising support during a broader market correction. The stock refuses to break down even as the market falls.

**Characteristics:**
- **3+ pullbacks** of 10-20% each
- **Each pullback low is higher than the prior** — creating a rising support trendline
- **Typically occurs during market corrections** — the stock shows relative strength by holding up
- **Duration**: 9-16 weeks typically
- **Volume**: Should contract on each successive pullback
- **Pivot point**: The high of the pattern — breakout above this level after the market correction ends

**What makes ascending bases special:**
- They identify stocks with the strongest institutional support — holders refuse to sell even during market weakness
- When the market turns, these stocks often lead the new advance

---

## Scoring Methodology

**Read `references/vcp-criteria.md`** for the detailed scoring framework. Here is a summary:

### Four Scoring Dimensions (25 points each, 100 total)

**1. Stage 2 Confirmation (25 points)**
- Price above rising 200-day MA: 10 points
- Price above rising 50-day MA (or 10-week MA): 10 points
- 200-day MA slope positive for 1+ month: 5 points
- All 3 met = 25 points. 2 of 3 = 15 points. 1 of 3 = 5 points. 0 = 0 points.

**2. Contraction Tightness (25 points)**
- Each successive contraction tighter than the prior: 10 points
- 3+ contractions with clear tightening: 10 points
- Deepest contraction ≤35%: 5 points
- Full marks for 3+ contractions with clear tightening progression. Partial for 2 contractions.

**3. Volume Dry-Up (25 points)**
- Volume declining on right side of base: 10 points
- Below-average volume during consolidation: 10 points
- Volume at multi-week low near pivot point: 5 points
- Full marks if volume at the pivot area is at its lowest point in the base.

**4. Relative Strength (RS) Line (25 points)**
- RS line at or near 52-week high: 15 points
- RS line trending up (not flat or declining): 10 points
- Full marks if RS line is at a new high even while price is still in the base (leading strength).

### Score Interpretation

| Score | Rating | Description |
|-------|--------|-------------|
| 90-100 | Textbook | All criteria strongly met. This is a textbook setup with the highest probability of success. |
| 80-89 | Strong | One minor weakness but otherwise an excellent setup. High probability. |
| 70-79 | Good | Developing pattern with clear positive traits. Needs monitoring for confirmation. |
| 60-69 | Developing | Needs more time or has a notable weakness. Watch but don't act yet. |
| <60 | Not Ready | Missing key criteria. Premature to consider as a breakout candidate. |

---

## Output Template

Structure your output in exactly this order, with these exact section headers:

```
## Breakout Setups Scan

**Tier: {0|1}** · **Date: {YYYY-MM-DD}** · **Candidates Scanned: {N}**
{If Tier 0: "Analyzing user-provided tickers. Connect FMP for market-wide scanning."}

### Setup Summary

| # | Ticker | Pattern | Score | Price | Pivot | Distance | Volume Profile | Sector | Stage |
|---|--------|---------|-------|-------|-------|----------|----------------|--------|-------|
| 1 | {TICK} | {VCP / Cup-and-Handle / Flat Base / Ascending Base} | {0-100} | ${current} | ${pivot} | {X% below pivot} | {Dry-up confirmed / Declining / Mixed} | {sector} | {2} |

### Detailed Setups

**1. {TICKER} — {Pattern Type} (Score: {X}/100, Rating: {Textbook/Strong/Good/Developing})**

**Pattern Description:**
{2-3 sentences describing the specific pattern forming — contractions, depth, duration}

**Score Breakdown:**

| Dimension | Score | Detail |
|-----------|-------|--------|
| Stage 2 Confirmation | {X}/25 | {Price vs. MAs, slope direction} |
| Contraction Tightness | {X}/25 | {T1: X%, T2: Y%, T3: Z%} |
| Volume Dry-Up | {X}/25 | {Volume trend description} |
| RS Line | {X}/25 | {RS position vs. 52-week high} |
| **Total** | **{X}/100** | |

**Key Levels:**
- **Pivot Point:** ${price} — breakout confirmation above this level
- **Invalidation Level:** ${price} — pattern fails below this level
- **Risk/Reward:** {X:1} based on pivot and invalidation

---

{Repeat for each setup, ranked by score from highest to lowest}

### Market Context

{1-2 paragraphs on the current market regime and what it means for breakout setups. Reference market health — breakout setups have the highest success rate during Confirmed Uptrend regimes and the lowest during Downtrend.}

**Regime Warning (if applicable):** If the market is in Downtrend or Uptrend Under Pressure, include: "⚠️ Current market regime ({regime}) reduces breakout success rates. Consider smaller position sizes or waiting for a follow-through day before acting on these setups."
```

---

## Invalidation Levels

Every setup MUST include a specific invalidation level — the price where the pattern fails. This is non-negotiable.

**How to determine invalidation:**
- **VCP**: The low of the most recent (tightest) contraction
- **Cup-and-Handle**: The low of the handle
- **Flat Base**: The low of the flat base
- **Ascending Base**: The most recent pullback low (the last higher low)

**Rules:**
- State the exact price level, not a vague range
- Calculate the risk as a percentage from the pivot point to the invalidation level
- If the risk (pivot to invalidation) exceeds 10%, note this as elevated risk
- A breakout where the risk exceeds 15% from pivot to invalidation is generally not worth taking — flag it as "Wide risk — consider waiting for a tighter setup"

---

## Conditional Logic

### Tier 0 vs. Tier 1 Input Behavior

- **Tier 1**: Skill runs autonomously — scans market, filters candidates, scores and ranks. User may optionally provide sector or market cap preferences.
- **Tier 0**: Skill requires user input — asks for tickers. Maximum recommended: 10 tickers. If user provides more than 10, analyze the first 10 and suggest connecting FMP for larger scans.

### Market Regime Consideration

Breakout setups do NOT exist in a vacuum. Market regime is a critical filter:

- **Confirmed Uptrend**: Best environment for breakouts. Full confidence in setups scoring 80+.
- **Uptrend Under Pressure**: Breakouts may fail. Suggest smaller positions and tighter invalidation. Only recommend setups scoring 85+.
- **Rally Attempt**: Too early for breakouts. Note that setups are forming but not actionable until a follow-through day confirms the rally.
- **Downtrend**: Worst environment for breakouts. Most breakouts fail in downtrends. **Explicitly warn the user** and suggest waiting for regime change.

If market regime data is available (from a prior Market Health analysis or web search), include it. If not, note: "Market regime not assessed — consider running Market Health first."

### No Qualifying Setups

If no stocks score 70+ after screening:
- State clearly: "No high-quality setups found in the current scan."
- Show the 2-3 highest-scoring candidates as "Developing" setups to watch
- Note whether this is due to market conditions (few breakouts in a correction) or filter criteria

---

## Data Freshness & Citations

### Citation Standards

Every technical claim must reference specific data:

- **Price levels**: "NVDA trading at $875, 3.2% below pivot of $904 (Yahoo Finance, {date})"
- **Moving averages**: "50-day MA at $842, rising; 200-day MA at $715, rising ({source})"
- **Volume**: "Volume contracting to 60% of 50-day average on right side of base ({source})"
- **RS line**: "RS line at new 52-week high vs. S&P 500 ({source})"

### Confidence Levels

Rate confidence for each setup:
- **HIGH**: Based on daily price/volume data from structured API (Tier 1)
- **MEDIUM**: Based on web-searched price data with possible delays
- **LOW**: Limited data available — pattern identification is approximate

---

## Tier 0 Provider Nudge

When operating at Tier 0 (no FMP configured), include this nudge at the end of the output, before the data footer. Because Tier 0 is severely limited for this skill, the nudge is slightly more detailed:

> 💡 Connect FMP in Settings → Providers to unlock market-wide scanning. FMP's free tier provides screener API access for systematic pattern detection across thousands of stocks. Currently limited to analyzing individual tickers.

Rules for the nudge:
- Include it once per report, at the bottom — never inline or mid-content
- This is NOT an error, NOT a locked-feature badge — it is an enhancement suggestion
- Do NOT include the nudge if FMP is already configured and providing Tier 1 data

---

## Quality Gate

Before presenting Breakout Setups, verify each item:

1. **Pattern validity**: Each setup is a recognized pattern (VCP, cup-and-handle, flat base, or ascending base). No made-up or unnamed patterns.
2. **Score accuracy**: Each scoring dimension (Stage 2, contraction, volume dry-up, RS line) is individually assessed with specific data. The total adds up correctly.
3. **Pivot point defined**: Every setup has a specific pivot price where the breakout is confirmed. Not a range — an exact level.
4. **Invalidation level defined**: Every setup has a specific price where the pattern fails. Not vague — an exact level with risk percentage.
5. **Volume confirmation**: Volume analysis is present for every setup. Volume dry-up during consolidation is the most important confirmation signal.
6. **RS line checked**: Relative strength vs. the index is assessed. Declining RS disqualifies a setup regardless of pattern quality.
7. **Market regime context**: The current market regime is noted and its impact on breakout success rates is stated.
8. **Risk/reward clarity**: The risk from pivot to invalidation is stated as a percentage. Setups with >10% risk are flagged.
9. **Data tier disclosure**: State which data tier was used (Tier 0 = user-provided tickers, Tier 1 = market scan).
10. **Source citations**: Every price level, volume figure, and technical claim cites a specific source and date.

---

## Data Freshness Footer

Every Breakout Setups scan ends with this footer:

```
---
Data as of: {YYYY-MM-DD} · Sources: {list all sources used} · Tier: {0|1}
```

Examples:
- `Data as of: 2026-03-21 · Sources: web search (Yahoo Finance, TradingView, MarketSmith), manual ticker analysis · Tier: 0`
- `Data as of: 2026-03-21 · Sources: FMP API (screener, historical prices, technical indicators), web search (TradingView) · Tier: 1`

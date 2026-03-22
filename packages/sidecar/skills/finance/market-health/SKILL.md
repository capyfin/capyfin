---
name: Market Health
description: Market regime assessment — distribution days, breadth, sector rotation, and composite health score (0-100).
version: 0.1.0
disable-model-invocation: true
metadata:
  openclaw:
    requires:
      - web_search
      - fetch
---

# Market Health

## Purpose & Identity

You are delivering a **Market Health** assessment — a structured, methodology-driven answer to the question: **"Bull or bear?"**

This skill produces a composite health score (0-100) and a regime verdict using a market direction methodology inspired by William O'Neill's approach. It synthesizes distribution day counting, breadth analysis, leading stock health, sector rotation, and sentiment into a single, actionable market posture.

This is not opinion. Every component is scored using specific criteria, and the composite score maps directly to one of four regimes. The output is designed to be comparable across time — today's score vs. last week's score reveals the direction of change.

**Personas:** Read and adopt `./skills/personas/macro-analyst/SKILL.md` for top-down economic context and quality standards. The macro-analyst mindset shapes how you interpret breadth, sector rotation, and regime transitions.

This skill operates at Tier 0 (web search + public sources, zero configuration, no API keys required) and enhances with Tier 1 data when available.

---

## Data Sourcing Instructions

### Tier 0 — Always Available (no API keys, zero configuration)

Gather the following data using web search and public sources:

**S&P 500 Daily Performance (last 25 trading days):**

- Search for S&P 500 daily performance history over the past 5 weeks
- For each day: closing price, daily change %, and volume (if available)
- This data is needed for distribution day counting
- Search query pattern: `"S&P 500 daily performance last 25 days"`, `"S&P 500 historical data [month year]"`

**NASDAQ Daily Performance (last 25 trading days):**

- Same data as S&P 500 but for the NASDAQ Composite
- Search query pattern: `"NASDAQ daily performance history"`, `"NASDAQ composite historical data"`

**Market Breadth Indicators:**

- Advance/decline ratio: number of advancing vs. declining stocks on NYSE
- Percentage of S&P 500 stocks above their 200-day moving average
- Percentage of S&P 500 stocks above their 50-day moving average
- New 52-week highs vs. new 52-week lows on NYSE
- Search query pattern: `"NYSE advance decline ratio today"`, `"S&P 500 stocks above 200 day moving average"`, `"new highs new lows NYSE"`

**Sector ETF Performance:**

- Performance of all 11 SPDR sector ETFs over 1-day and 1-month windows
- Needed for sector rotation analysis (offensive vs. defensive)
- Search query pattern: `"sector ETF performance today"`, `"sector rotation analysis"`

**VIX (CBOE Volatility Index):**

- Current VIX level
- VIX trend (direction over past week)
- Search query pattern: `"VIX level today"`, `"VIX index current"`

**Leading Stock Health:**

- Check the performance of high-relative-strength leaders
- Are stocks with 52-week-high RS ratings breaking out or breaking down?
- Search query pattern: `"market leading stocks performance"`, `"high relative strength stocks today"`, `"IBD top stocks"`

### Tier 1 — FMP Enhancement (if configured)

When FMP (Financial Modeling Prep) is available, use these endpoints:

- **Historical daily data:** `/api/v3/historical-price-full/%5EGSPC?timeseries=25` for precise daily OHLCV (volume is critical for distribution day counting)
- **Sector performance:** `/api/v3/sector-performance` and `/api/v3/sectors-performance` for precise sector data
- **Market breadth:** Derived from `/api/v3/stock-screener` queries filtering by MA relationships
- **Index quotes:** `/api/v3/quote/%5EGSPC,%5EIXIC,%5EDJI,%5ERUT` for real-time data

Tier 1 significantly improves distribution day accuracy because volume data is essential for the methodology. At Tier 0, volume data may be approximate or unavailable.

---

## Market Direction Methodology

This is the core analytical framework. Follow each component precisely.

### Distribution Day Counting

A **distribution day** occurs when a major index (S&P 500 or NASDAQ) declines **≥0.2%** on **higher volume** than the previous trading session. Distribution days indicate institutional selling — large funds liquidating positions.

**Counting rules:**

- Track distribution days over a **rolling 25 trading day** window (~5 calendar weeks)
- Count distribution days separately for S&P 500 and NASDAQ; use the higher count
- A distribution day "expires" after 25 trading days (it ages out of the window)
- A distribution day is also removed if the index rallies **5%** or more from its close on the distribution day (the selling has been absorbed)
- Stalling days count: when the index closes up but in the lower half of its daily range on higher volume — this signals distribution disguised as a flat/up day

**Interpretation:**

- **0-2 distribution days:** Normal, healthy market. Institutions are not aggressively selling.
- **3 distribution days:** Accumulation of selling pressure. Monitor closely.
- **4-5 distribution days:** Warning zone. Institutions are reducing exposure. The market is under pressure.
- **6+ distribution days:** Danger. Heavy institutional selling. High probability of a meaningful decline. The weight of distribution is unsustainable.

**Tier 0 limitation:** At Tier 0, volume data may not be available for every session. When volume is unavailable, count days where the index declined ≥0.2% as "probable distribution days" and note: "Volume data unavailable — distribution day count is approximate. Connect FMP for precise volume-confirmed counts."

### Follow-Through Day (FTD) Logic

A **Follow-Through Day** confirms a new uptrend after a meaningful market decline. It is the signal to begin increasing equity exposure.

**Prerequisites for an FTD:**

1. The market must have experienced a meaningful decline — at least 3 consecutive down days or a correction of ≥5% from a recent high
2. After the decline, a rally attempt begins: the index makes an intraday low and then closes higher for at least 1 day (Day 1 of the rally attempt)
3. The FTD occurs on **Day 4 or later** of the rally attempt

**FTD criteria:**

- A major index (S&P 500 or NASDAQ) gains **≥1.5%** on **higher volume** than the previous session
- The gain must be a genuine price surge, not a gap-up that fades
- An FTD on Day 4-7 of the rally is stronger than one on Day 10+

**What an FTD means:**

- It shifts the regime from Downtrend to Rally Attempt (not Confirmed Uptrend — that requires follow-through after the FTD)
- Not all FTDs succeed — roughly 25-30% fail. They are necessary but not sufficient.
- After an FTD, the distribution day count resets

**What invalidates an FTD:**

- The index undercuts the low of the rally attempt within days of the FTD
- Distribution days accumulate rapidly after the FTD (3+ within 2 weeks)

### Breadth Analysis

Breadth measures how many stocks are participating in the market's direction. A rising index with deteriorating breadth is a warning sign — the advance is narrowing.

**Key breadth metrics:**

1. **Advance/Decline Ratio:** Ratio of advancing to declining stocks on the NYSE.
   - A/D > 2:1 on an up day = strong breadth
   - A/D < 1:1 on a supposed up day = divergence warning
   - Cumulative A/D line making new highs with the index = healthy
   - Cumulative A/D line diverging (index new high, A/D not) = warning

2. **Percentage of S&P 500 Above 200-Day Moving Average:**
   - > 70% = broad strength, healthy uptrend
   - 60-70% = adequate, monitor for deterioration
   - 50-60% = narrowing participation, caution
   - 40-50% = significant weakness, many stocks in downtrends
   - <40% = market-wide downtrend

3. **Percentage of S&P 500 Above 50-Day Moving Average:**
   - More sensitive than 200-day; captures shorter-term shifts
   - <30% = severely oversold (often a contrarian buy signal near market bottoms)
   - > 80% = overbought (not necessarily bearish — strong trends stay overbought)

4. **New Highs vs. New Lows (NYSE):**
   - Healthy market: new highs consistently > new lows (10:1 or better)
   - Warning: new highs declining while index holds up
   - Danger: new lows > new highs while index is near recent highs

**Breadth divergence** is one of the most reliable warning signals. When the index makes a new high but breadth metrics do not confirm, institutional participation is narrowing. This often precedes a meaningful decline by 2-8 weeks.

### Leading Stock Health

The market's true health is revealed by what its best stocks are doing. If high-relative-strength leaders are breaking down, the market is sicker than the index suggests.

**Assessment criteria:**

- Are stocks with top RS (relative strength) ratings breaking out to new highs, or failing at resistance?
- Are recent breakouts holding and advancing, or reversing on volume?
- Are leaders building constructive bases (tight consolidation, volume dry-up) or showing wide, loose, erratic action?
- Is the number of stocks making new highs expanding or contracting?

**Scoring guide:**

- **Majority breaking out on volume:** Leaders are healthy. Market has fuel. (20 points)
- **Holding in bases, not breaking down:** Constructive. Market is consolidating, not topping. (15 points)
- **Mixed — some breaking out, some failing:** Selectivity required. Market is rotating, not uniformly strong. (10 points)
- **Leaders breaking down on volume:** Institutional distribution of the best stocks. Serious warning. (5 points)

### Sector Rotation Pattern

Sector rotation reveals institutional risk appetite. Money flows from offensive to defensive sectors as institutions de-risk, and vice versa during recovery.

**Classification:**

- **Offensive sectors outperforming:** Technology (XLK), Consumer Discretionary (XLY), Industrials (XLI), Communication Services (XLC)
- **Defensive sectors outperforming:** Utilities (XLU), Healthcare (XLV), Consumer Staples (XLP)
- **Rate-sensitive:** Financials (XLF), Real Estate (XLRE)
- **Commodity-linked:** Energy (XLE), Materials (XLB)

**Rotation signals:**

- Offensive leading over both 1-week and 1-month → risk appetite is healthy
- Defensive leading over 1-month while offensive led 1-week → short-term bounce in a cautious market
- Defensive leading over both timeframes → institutions are de-risking, caution
- Commodity sectors surging → inflation concerns or supply shock

Compare sector performance over 1-day, 1-week, and 1-month windows. The 1-month window is the most reliable signal; the 1-day can be noise.

---

## Regime Classification

Assign the market to exactly one of these four regimes. Each has specific criteria — do not mix or invent regimes.

### 🟢 Confirmed Uptrend

**Criteria (most must be met):**

- Major indices above rising 50-day and 200-day moving averages
- Distribution day count ≤ 3 in the past 25 sessions
- Breadth expanding: A/D ratio positive, >60% of S&P 500 above 200-day MA
- Leading stocks breaking out on volume
- Offensive sectors outperforming defensive sectors
- VIX low and stable (typically <20)

**Exposure guidance range:** 80-100% equity

### 🟡 Uptrend Under Pressure

**Criteria (several must be met):**

- Indices still above 50-day MA but distribution days accumulating (4-5 in 25 sessions)
- Breadth starting to narrow: fewer stocks participating, A/D line flattening
- Some leading stocks showing sell signals (breaking support, high-volume reversals)
- Mixed sector rotation: some defensive sectors starting to outperform
- VIX ticking higher but still <25

**Exposure guidance range:** 60-80% equity

### 🟠 Rally Attempt

**Criteria:**

- After a meaningful decline, the market is attempting to rally
- No confirmed Follow-Through Day yet, OR an FTD occurred but follow-through is weak
- Distribution day count has reset (or is resetting)
- Breadth trying to improve from oversold readings
- Leading stocks attempting to form new bases
- Outcome uncertain: could evolve into Confirmed Uptrend or fail back to Downtrend

**Exposure guidance range:** 40-60% equity (scale in carefully, don't go all-in on the attempt)

### 🔴 Downtrend

**Criteria (several must be met):**

- Major indices below declining 50-day MA, possibly below 200-day MA
- Distribution day count ≥ 6, OR major indices broke below key support levels
- Breadth contracting: <40% of S&P 500 above 200-day MA
- Leading stocks breaking down — failed breakouts, high-volume declines
- Defensive sectors outperforming offensive sectors
- VIX elevated (typically >25)

**Exposure guidance range:** 0-40% equity (capital preservation mode)

---

## Composite Score Methodology

Calculate a composite health score from 0-100 by summing five components. Each component has a defined scoring rubric — do not improvise.

### Component 1: Distribution Day Count (0-25 points)

| Distribution Days (25-day window) | Score |
| --------------------------------- | ----- |
| 0 days                            | 25    |
| 1-2 days                          | 20    |
| 3 days                            | 15    |
| 4-5 days                          | 10    |
| 6+ days                           | 0     |

Use the higher count between S&P 500 and NASDAQ.

### Component 2: Breadth (0-25 points)

Based on the percentage of S&P 500 stocks above their 200-day moving average:

| % Above 200-Day MA | Score |
| ------------------ | ----- |
| >70%               | 25    |
| 60-70%             | 20    |
| 50-60%             | 15    |
| 40-50%             | 10    |
| <40%               | 5     |

### Component 3: Leading Stock Health (0-20 points)

| Leading Stock Assessment              | Score |
| ------------------------------------- | ----- |
| Majority breaking out on volume       | 20    |
| Holding in constructive bases         | 15    |
| Mixed — some breakouts, some failures | 10    |
| Breaking down on volume               | 5     |

### Component 4: Sector Rotation (0-15 points)

| Rotation Pattern                                     | Score |
| ---------------------------------------------------- | ----- |
| Offensive sectors outperforming (1-week and 1-month) | 15    |
| Mixed — no clear pattern                             | 10    |
| Defensive sectors outperforming (1-week and 1-month) | 5     |

### Component 5: Sentiment / VIX (0-15 points)

| VIX Level | Score | Interpretation                                                    |
| --------- | ----- | ----------------------------------------------------------------- |
| <15       | 10    | Complacent — slight warning (low fear often precedes corrections) |
| 15-20     | 15    | Normal — healthy risk appetite                                    |
| 20-30     | 12    | Elevated fear — often contrarian bullish, but respect the signal  |
| >30       | 5     | Panic — contrarian bullish long-term but dangerous short-term     |

### Score Interpretation

| Score Range | Label        | Typical Regime         |
| ----------- | ------------ | ---------------------- |
| 80-100      | **Strong**   | Confirmed Uptrend      |
| 60-79       | **Moderate** | Uptrend Under Pressure |
| 40-59       | **Weak**     | Rally Attempt          |
| 0-39        | **Poor**     | Downtrend              |

**Important:** The composite score and the regime verdict should be consistent. If they diverge (e.g., score says "Moderate" but qualitative signals say "Downtrend"), explain the divergence explicitly and state which you weight more heavily.

---

## Output Template

Structure your output in exactly this order, with these exact section headers:

### Section 1: Regime Verdict

```
## 🟢 Confirmed Uptrend | 🟡 Uptrend Under Pressure | 🟠 Rally Attempt | 🔴 Downtrend

[1-sentence rationale citing 2-3 supporting data points]
```

Example: `## 🟡 Uptrend Under Pressure — S&P 500 above 50-day MA but 5 distribution days in 25 sessions; breadth narrowing with only 58% of stocks above 200-day MA; defensive sectors gaining relative strength over past 2 weeks.`

### Section 2: Composite Score

```
## Composite Score: XX/100 — [Strong|Moderate|Weak|Poor]

[Visual bar: ████████░░ 80/100]
```

Use a 10-block visual bar where each block represents 10 points. Filled blocks (█) for the score, empty (░) for the remainder.

### Section 3: Component Breakdown

```
## Component Breakdown

| Component | Score | Detail |
|-----------|-------|--------|
| Distribution Days | X/25 | Y distribution days in last 25 sessions |
| Breadth | X/25 | Z% of S&P 500 above 200-day MA |
| Leading Stocks | X/20 | [Brief assessment] |
| Sector Rotation | X/15 | [Offensive/Defensive/Mixed] — [specific data] |
| Sentiment (VIX) | X/15 | VIX at Y.Z — [interpretation] |
| **Total** | **XX/100** | |
```

Every cell in the "Detail" column must contain a specific data point — not a generic assessment.

### Section 4: What Changed

```
## What Changed

- [Specific change vs. last assessment]
- [Specific change vs. last assessment]
- [Specific change vs. last assessment]
```

If this is the first time running Market Health, state: "Initial assessment — no prior data for comparison. Future runs will track changes."

If there is prior data, note specific changes:

- Distribution day count changes (added, expired, removed by rally)
- Breadth metric changes (% above 200-day MA up or down)
- Regime transitions (from X to Y)
- Score changes (+/- points and which components moved)

### Section 5: Exposure Guidance

```
## Exposure Guidance

**Suggested equity exposure: XX-XX%**

[2-3 sentences of rationale linking the regime, score, and current conditions to the exposure suggestion. Include what would change the guidance up or down.]
```

**Important framing:** This is educational context, not financial advice. Use language like "Consider..." or "In this environment, a typical range would be..." or "The methodology suggests..."

Always state:

- What would increase exposure (e.g., "If distribution day count drops to ≤2 and breadth improves above 65%, would upgrade to Confirmed Uptrend")
- What would decrease exposure (e.g., "If 2 more distribution days occur this week, would downgrade to Downtrend")

### Section 6: Footer

```
---
Data as of: {YYYY-MM-DD HH:MM ET} · Sources: {list sources used} · Tier: {0|1}
```

---

## Conditional Logic

### First Run (No Prior Data)

The "What Changed" section requires a previous assessment for comparison. On first run:

- State: "Initial assessment — no prior data for comparison."
- Provide the full assessment without change tracking
- Note: "Future runs will track changes in distribution day count, breadth, score, and regime."

### Tier 0 Limitations

At Tier 0 (web search only), some data may be approximate:

- **Volume data** may not be available for every session, making distribution day counting approximate
- Note: "Distribution day count is approximate — volume data unavailable for precise confirmation. Count reflects days with ≥0.2% decline."
- Breadth data (% above 200-day MA) should be findable via web search but may lag by 1 day
- Leading stock assessment relies on web-searched relative strength data

### Weekend / Holiday

If the market is closed:

- Use last trading day data for all components
- Note: "Markets closed — assessment reflects data as of [last trading day, date]."
- Do not project or estimate — report the most recent actual data

### Score-Regime Divergence

If the composite score maps to a different regime than the qualitative assessment:

- Present both: "Composite score: 62/100 (Moderate — maps to Uptrend Under Pressure). However, qualitative signals (6 distribution days, leaders breaking down) point to Downtrend."
- Explain which you weight more heavily and why
- This divergence itself is a signal — it means the market is at an inflection point

---

## Data Freshness & Citations

Every data point must meet these standards:

1. **Timestamp:** All market data must note the date and time of retrieval. Distribution day counts must specify the date range covered.
2. **Source attribution:** Cite where each data element came from:
   - Tier 0: "via web search" with the source website name
   - Tier 1: "via FMP API" for structured data
3. **Staleness warning:** If market data is more than 1 trading day old, flag it.
4. **Distribution day data source:** Explicitly state whether distribution days are volume-confirmed (Tier 1) or approximated (Tier 0).
5. **Footer format:**

```
---
Data as of: {YYYY-MM-DD HH:MM ET} · Sources: {list all sources} · Tier: {0|1}
```

---

## Tier 0 Provider Nudge

When operating at Tier 0 (no FMP configured), include this single line at the very end of the output, before the data footer:

> 💡 Connect FMP in Settings → Providers for volume-confirmed distribution day counting and precise breadth data. It's free.

Rules for the nudge:

- Include it once per assessment, at the bottom — never inline or mid-content
- This is NOT an error, NOT a locked-feature badge — it is a gentle enhancement suggestion
- Do NOT include the nudge if FMP is already configured and providing Tier 1 data
- Do NOT make the nudge sound like a limitation — frame it as an optional improvement
- Keep it to a single line

---

## Quality Checklist

Before presenting the Market Health assessment, verify each item:

1. **Regime-score consistency:** The regime verdict (Confirmed Uptrend / Uptrend Under Pressure / Rally Attempt / Downtrend) is consistent with the composite score range. If they diverge, the divergence is explained.
2. **Component justification:** Every component score in the breakdown table is justified with a specific data point — not "breadth is okay" but "62% of S&P 500 above 200-day MA."
3. **Distribution day specificity:** Distribution day count is based on actual daily data. Each claimed distribution day should reference a specific date and decline magnitude. If approximate (Tier 0), this is noted.
4. **Exposure-regime alignment:** Exposure guidance aligns with the regime. Do not suggest 90% equity in a Downtrend or 20% equity in a Confirmed Uptrend.
5. **What Changed specificity:** Changes are specific numbers and dates, not generic "things got worse."
6. **Methodology fidelity:** The assessment follows the O'Neill-inspired methodology defined in this skill — distribution days, FTD logic, breadth, leading stock health, sector rotation. Do not substitute with a different framework.
7. **Invalidation conditions:** Both the regime verdict and exposure guidance include what would change them — specific data points and thresholds.
8. **Data completeness:** All 5 components are scored. No component is skipped. If data is unavailable for a component, score it conservatively and note the limitation.
9. **Macro-analyst standards:** The assessment meets the quality standards defined in the macro-analyst persona — specific data points, dated references, regime supported by evidence.
10. **No financial advice language:** Use educational framing ("this methodology suggests," "consider") — never directive language ("you should," "buy," "sell").

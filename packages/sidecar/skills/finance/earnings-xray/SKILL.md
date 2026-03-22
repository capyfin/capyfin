---
name: Earnings X-Ray
description: Earnings analysis — beat/miss assessment, guidance quality, segment performance, management tone, post-earnings drift score with PEAD-based A-F grading.
version: 0.1.0
disable-model-invocation: true
metadata:
  openclaw:
    requires:
      - web_search
      - fetch
---

# Earnings X-Ray

## Purpose & Scope

You are producing an **Earnings X-Ray** — a structured analysis of a company's earnings event. This is the "RESEARCH" card on the Launchpad: it covers both **reported earnings** (what happened) and **upcoming earnings** (what to expect).

The Earnings X-Ray answers: **"Did they beat or miss, how good was the quality, and what's the post-earnings drift setup?"**

This skill requires a **ticker** as input. It operates in two modes depending on timing:

1. **Reported Earnings Mode** — When the most recent earnings have been reported. Analyzes the actual results: revenue & EPS vs. estimates, guidance quality, segment performance, management tone, and post-earnings price drift.
2. **Upcoming Earnings Mode** — When the next earnings date is approaching (within ~3 weeks). Previews the event: consensus estimates, historical beat/miss pattern, key metrics to watch, and implied move from options.

Output must be self-contained with full source citations.

**Persona:** Read and adopt `./skills/personas/fundamental-analyst/SKILL.md` for domain expertise and quality standards. The fundamental-analyst mindset shapes how you evaluate earnings quality, assess guidance credibility, and enforce evidence-based rigor.

---

## Data Sourcing Strategy

### Pre-Analysis Data Checklist

Before writing any analysis, determine the earnings mode and gather ALL relevant data. Do not begin writing until you have assembled the raw inputs.

**For Reported Earnings:**

1. **Earnings date and time**: When were results released (pre-market or after-hours)?
2. **Revenue**: Actual vs. consensus estimate, beat/miss magnitude, year-over-year growth
3. **EPS**: GAAP and non-GAAP actual vs. consensus estimate, beat/miss magnitude
4. **Guidance**: Company guidance for next quarter and full year vs. consensus expectations
5. **Segment data**: Revenue and margin by business segment
6. **Earnings call transcript**: Key quotes from management (CEO and CFO statements)
7. **Post-earnings price action**: Gap size on results day, volume, 3-day follow-through
8. **Technical context**: Position relative to 200-day MA and 50-day MA before earnings

**For Upcoming Earnings:**

1. **Expected earnings date**: When is the company expected to report?
2. **Consensus estimates**: Revenue and EPS expectations for the quarter
3. **Estimate revisions**: Have analysts revised estimates up or down in the last 30/60/90 days?
4. **Historical beat/miss**: Last 4 quarters — actual vs. estimate with surprise percentage
5. **Key metrics to watch**: Segment-specific or company-specific metrics the market cares about
6. **Implied move from options**: If available, the options-implied expected move around earnings

### Tier 0 — Always Available (no API keys, zero configuration)

**SEC EDGAR — Primary Source for Filing Data:**

- **10-Q quarterly filings**: Navigate to `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}&type=10-Q&dateb=&owner=include&count=5` to find the most recent quarterly reports
- **8-K filings (earnings releases)**: Change `type=10-Q` to `type=8-K` in the URL above — earnings press releases are filed as 8-K
- **What to extract from 10-Q:**
  - Revenue by segment (Item 2 — MD&A, or financial statement notes)
  - Gross margin, operating margin, net margin changes
  - Management commentary on performance drivers and outlook
  - Any unusual or one-time items that affect comparability

**Web Search — Supplementary Data:**

- Search for `"{ticker} earnings results Q{N} {YEAR}"` for actual results vs. estimates
- Search for `"{ticker} earnings call transcript"` for management quotes and tone
- Search for `"{ticker} earnings guidance"` for forward guidance details
- Search for `"{ticker} earnings estimate"` for consensus expectations (upcoming mode)
- Search for `"{ticker} options implied move earnings"` for expected move data
- Search for `"{ticker} stock price earnings reaction"` for post-earnings price action

**Important Tier 0 Notes:**

- Web-searched earnings data is typically available within hours of the release
- SEC EDGAR 8-K filings may lag by 1-2 business days after the press release
- Cross-reference web-searched numbers against the 8-K filing when possible
- Earnings call transcripts are often available on financial news sites within 24 hours

### Tier 1 — FMP Enhancement (if configured)

When FMP (Financial Modeling Prep) is available, use these endpoints for structured data:

- **Earnings calendar:** `/api/v3/earning_calendar?from={date}&to={date}` for upcoming dates
- **Earnings surprises:** `/api/v3/earnings-surprises/{ticker}` for historical beat/miss data (last 4+ quarters)
- **Earnings estimates:** `/api/v3/analyst-estimates/{ticker}` for consensus estimates
- **Income statement (quarterly):** `/api/v3/income-statement/{ticker}?period=quarter&limit=8` for segment and margin data
- **Stock price:** `/api/v3/historical-price-full/{ticker}` for post-earnings price action
- **Key metrics (quarterly):** `/api/v3/key-metrics/{ticker}?period=quarter&limit=8` for per-share metrics

Tier 1 provides faster, more structured, and more reliable earnings data. Always prefer Tier 1 when available, but fall back gracefully to Tier 0.

---

## Earnings Detection Logic

Before starting the analysis, determine which mode to use:

1. **Find the most recent earnings date** — Search for `"{ticker} last earnings date"` or use FMP earnings calendar
2. **Find the next expected earnings date** — Search for `"{ticker} next earnings date"`
3. **Decision rule:**
   - If the most recent earnings were reported **within the last 45 days** → **Reported Earnings Mode**
   - If the next earnings date is **within the next 21 days** → **Upcoming Earnings Mode**
   - If both conditions are met (reported recently AND next earnings soon), **prioritize Reported** but add a brief "Looking Ahead" section
   - If neither condition is met, use **Reported Earnings Mode** for the most recent quarter with a note on when next earnings are expected

**State the mode clearly** at the top of the output: "Analyzing Q{N} {YEAR} Reported Earnings" or "Previewing Upcoming Q{N} {YEAR} Earnings"

---

## Reported Earnings Methodology

### Revenue & EPS Analysis

**Revenue:**

- State actual revenue vs. consensus estimate with beat/miss amount and percentage
- Year-over-year revenue growth rate
- Sequential (quarter-over-quarter) growth rate
- Note if this is organic growth or includes acquisition contributions
- Compare to the company's own guidance (if provided last quarter)

**EPS:**

- State GAAP EPS vs. consensus estimate with beat/miss amount
- State non-GAAP (adjusted) EPS if different, noting the reconciliation items
- Year-over-year EPS growth rate
- Flag any significant gap between GAAP and non-GAAP (>20% difference warrants explanation)
- Note share buyback impact on EPS growth vs. actual earnings growth

### Guidance Assessment

Evaluate the quality and direction of forward guidance:

- **Raised**: Company raised guidance above prior range AND above consensus — bullish signal
- **Maintained**: Guidance unchanged — neutral, but may disappoint if market expected a raise after a beat
- **Lowered**: Company lowered guidance below prior range — bearish signal regardless of current quarter beat
- **Guidance Quality**: Is the guidance specific (exact range) or vague ("we expect continued growth")? Specific guidance from management signals confidence.

Rate guidance quality: **Strong** (raised + specific), **Neutral** (maintained), **Weak** (lowered or vague)

### Segment Performance

Break down results by business segment:

- Revenue per segment with growth rate
- Identify the fastest-growing and slowest-growing segments
- Note any margin changes by segment (expanding or compressing)
- Flag any segment contributing >50% of total revenue — concentration risk
- Compare segment performance to management's prior commentary

### Management Tone Analysis

Extract exactly **3 key quotes** from the earnings call that reveal management's outlook:

1. **Most bullish statement** — the strongest forward-looking positive claim
2. **Most cautious statement** — the biggest concern or risk acknowledged
3. **Most revealing statement** — something that signals a strategic shift or unexpected development

For each quote:

- Include the exact quote (or close paraphrase with attribution)
- Note who said it (CEO, CFO, etc.)
- Assess the signal: what does this tell us that the numbers don't?

### Post-Earnings Price Action

Analyze the market's reaction to earnings:

- **Gap size**: Opening price vs. prior close, expressed as percentage
- **Gap direction**: Up or down
- **Volume on gap day**: Compare to average daily volume — a ratio above 2x indicates strong conviction
- **Follow-through**: Price action over the 3 sessions after the gap. Did the gap hold, extend, or reverse?
- **Where it closed relative to the day's range**: Closing in the upper 25% of the range = bullish. Closing in the lower 25% = bearish.

---

## Drift Score Methodology (PEAD-Based)

The Post-Earnings Announcement Drift (PEAD) is one of the most well-documented anomalies in academic finance. Stocks that beat earnings significantly tend to continue drifting in the direction of the surprise for 30-60 days. The Drift Score grades the setup quality for post-earnings drift.

**Five Factors — each scored Yes (1) or No (0):**

### Factor 1: Earnings Surprise Magnitude

- **Yes (1 point):** EPS surprise > 10% (beat by more than 10% of the estimate)
- **No (0 points):** EPS surprise ≤ 10% or a miss
- **Why it matters:** Larger surprises produce stronger and more persistent drift. Small beats often get absorbed quickly.

### Factor 2: Pre-Earnings Trend Quality

- **Yes (1 point):** Stock was in a Stage 2 uptrend before earnings (price above rising 50-day and 200-day MA)
- **No (0 points):** Stock was in a downtrend, base, or Stage 4 decline before earnings
- **Why it matters:** Earnings beats in uptrending stocks get reinforced by existing momentum. Beats in downtrending stocks often produce only a short-term bounce.

### Factor 3: Volume Confirmation

- **Yes (1 point):** Volume on the earnings gap day was >1.5x the 50-day average volume
- **No (0 points):** Volume on the gap day was below 1.5x average
- **Why it matters:** High volume gaps indicate institutional participation, not just retail reaction. Institutions drive sustained moves.

### Factor 4: Position Relative to 200-Day MA

- **Yes (1 point):** Stock is trading above its 200-day moving average after the earnings gap
- **No (0 points):** Stock is below its 200-day MA
- **Why it matters:** Stocks above the 200-day MA are in long-term uptrends. PEAD is strongest in stocks with positive long-term momentum.

### Factor 5: Position Relative to 50-Day MA

- **Yes (1 point):** Stock is trading above its 50-day moving average after the earnings gap
- **No (0 points):** Stock is below its 50-day MA
- **Why it matters:** The 50-day MA confirms intermediate-term trend health. Being above both MAs = strongest drift signal.

### Grading Scale

| Grade | Score | Interpretation                                                                                                                 |
| ----- | ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| **A** | 5/5   | All factors aligned — strongest drift setup. Historically, A-grade setups show the most persistent post-earnings drift.        |
| **B** | 4/5   | Strong setup with one minor weakness. Still a high-quality drift candidate.                                                    |
| **C** | 3/5   | Mixed signals. Drift may occur but is less reliable. Proceed with caution.                                                     |
| **D** | 2/5   | Weak setup. Most drift factors are absent. Not a compelling post-earnings play.                                                |
| **F** | 0-1/5 | Poor setup. Avoid trading based on post-earnings drift. The earnings event does not set up for sustained directional movement. |

**Important:** The Drift Score applies only to Reported Earnings Mode. It is NOT generated for Upcoming Earnings Mode.

---

## Upcoming Earnings Methodology

### Consensus Estimates

- Current consensus revenue estimate for the upcoming quarter
- Current consensus EPS estimate (GAAP and non-GAAP if available)
- Range of analyst estimates (low to high) showing dispersion
- Number of analysts covering the stock
- Estimate revision trend: have estimates been revised up or down over the last 30/60/90 days?

### Historical Beat/Miss Pattern

Show the last 4 quarters in a table:

| Quarter     | Revenue Est | Revenue Act | Surprise % | EPS Est | EPS Act | Surprise % |
| ----------- | ----------- | ----------- | ---------- | ------- | ------- | ---------- |
| Q{N} {YEAR} |             |             |            |         |         |            |

- Calculate the average surprise percentage over the 4 quarters
- Note any trend: is the company consistently beating, consistently missing, or mixed?
- Flag if the magnitude of beats/misses is changing (accelerating or decelerating surprises)

### Key Metrics to Watch

Identify 3-5 company-specific metrics that the market will focus on:

- For cloud companies: ARR, net retention rate, customer count
- For consumer companies: same-store sales, average order value, subscriber count
- For industrials: order backlog, book-to-bill ratio, capacity utilization
- For any company: gross margin trend, free cash flow, guidance specificity

For each metric, state: what it was last quarter, what the market expects, and why it matters.

### Implied Move from Options

If available from web search:

- Straddle price for the nearest expiration after earnings
- Implied move percentage (straddle price / stock price)
- Compare implied move to actual moves from the last 4 quarters
- Note: if the implied move is significantly larger or smaller than historical moves, that itself is a signal

---

## Output Template

Structure your output in exactly this order, with these exact section headers:

### Reported Earnings Output

```
## Earnings X-Ray: {COMPANY NAME} ({TICKER})
**Mode: Q{N} {YEAR} Reported Earnings** · Reported {DATE}

### Revenue & EPS

| Metric | Estimate | Actual | Surprise | YoY Change |
|--------|----------|--------|----------|------------|
| Revenue | ${est} | ${act} | {beat/miss by $X, Y%} | {+/-Z%} |
| GAAP EPS | ${est} | ${act} | {beat/miss by $X, Y%} | {+/-Z%} |
| Non-GAAP EPS | ${est} | ${act} | {beat/miss by $X, Y%} | {+/-Z%} |

[Commentary on quality of the beat/miss — one-time items, buyback impact, organic vs. acquired]

### Guidance

**Direction: [Raised / Maintained / Lowered]**
**Quality: [Strong / Neutral / Weak]**

| Metric | Prior Guidance | New Guidance | Consensus | vs. Consensus |
|--------|---------------|--------------|-----------|---------------|
| Revenue | {range} | {range} | ${est} | {above/below/in-line} |
| EPS | {range} | {range} | ${est} | {above/below/in-line} |

[Commentary on what the guidance tells us]

### Segment Performance

| Segment | Revenue | YoY Growth | Margin | Trend |
|---------|---------|------------|--------|-------|
| {Segment 1} | ${X} | {+/-Y%} | {Z%} | [Expanding / Stable / Compressing] |

[Commentary on segment dynamics — which segment drove the beat/miss?]

### Management Tone

1. **Most Bullish:** "{quote}" — {Speaker}, {interpretation}
2. **Most Cautious:** "{quote}" — {Speaker}, {interpretation}
3. **Most Revealing:** "{quote}" — {Speaker}, {interpretation}

### Post-Earnings Price Action

| Metric | Value |
|--------|-------|
| Gap | {+/-X%} ({direction}) |
| Volume vs. Avg | {X.Xx} (ratio) |
| 3-Day Follow-Through | {description} |
| Close Position in Range | {Upper / Middle / Lower 25%} |

### Drift Score: {GRADE}

| Factor | Result | Points |
|--------|--------|--------|
| Earnings Surprise > 10% | {Yes/No} | {1/0} |
| Pre-Earnings Stage 2 Uptrend | {Yes/No} | {1/0} |
| Volume > 1.5x Average | {Yes/No} | {1/0} |
| Above 200-Day MA | {Yes/No} | {1/0} |
| Above 50-Day MA | {Yes/No} | {1/0} |
| **Total** | | **{X}/5 = Grade {A-F}** |

[1-2 sentence interpretation of the drift score and what it means for the next 30-60 days]
```

### Upcoming Earnings Output

```
## Earnings X-Ray: {COMPANY NAME} ({TICKER})
**Mode: Upcoming Q{N} {YEAR} Earnings** · Expected {DATE}

### Consensus Estimates

| Metric | Estimate | Analyst Range | # Analysts | 30-Day Revision |
|--------|----------|---------------|------------|-----------------|
| Revenue | ${est} | ${low} - ${high} | {N} | {up/down X%} |
| EPS | ${est} | ${low} - ${high} | {N} | {up/down X%} |

[Commentary on estimate revisions — are analysts getting more or less bullish?]

### Historical Beat/Miss Pattern

| Quarter | Revenue Surprise | EPS Surprise |
|---------|-----------------|--------------|
| Q{N-4} | {+/-X%} | {+/-Y%} |
| Q{N-3} | {+/-X%} | {+/-Y%} |
| Q{N-2} | {+/-X%} | {+/-Y%} |
| Q{N-1} | {+/-X%} | {+/-Y%} |
| **Average** | **{+/-X%}** | **{+/-Y%}** |

[Commentary on the pattern — consistent beater, mixed, or deteriorating?]

### Key Metrics to Watch

1. **{Metric 1}**: Last quarter {X}, market expects {Y}. Matters because {reason}.
2. **{Metric 2}**: Last quarter {X}, market expects {Y}. Matters because {reason}.
3. **{Metric 3}**: Last quarter {X}, market expects {Y}. Matters because {reason}.

### Implied Move

- **Options-implied move:** {+/-X%}
- **Historical average actual move (4Q):** {+/-Y%}
- **Assessment:** {Market pricing in more/less volatility than typical}

[Commentary on positioning implications]
```

---

## Conditional Logic

### Company Doesn't Report Quarterly

Some non-US companies report semi-annually. In this case:

- State the reporting cadence clearly
- Use the most recent reporting period (H1/H2 instead of Q1-Q4)
- Adjust the historical beat/miss table to show the last 4 reporting periods

### Pre-Market vs. After-Hours Reporting

Note the timing of the earnings release — it affects how to interpret the immediate price reaction:

- **Pre-market**: The opening gap IS the reaction. After-hours trading is thin and unreliable.
- **After-hours**: The after-hours move is initial reaction. The opening gap the next day is the more reliable signal.

### Earnings Not Yet Reported (Edge Case)

If the user provides a ticker and no earnings have been reported in the last 6 months, and no upcoming earnings date is within 3 weeks:

- Default to Reported mode for the most recent earnings
- Note that the data may be stale
- Include the expected next earnings date if available

### Recent IPO or SPAC

If the company has fewer than 4 quarters of public earnings history:

- Show only the available quarters in the historical table
- Note the limited history and reduce confidence level accordingly
- Still produce the full analysis for the most recent quarter

---

## Data Freshness & Citations

### Citation Standards

Every factual claim in the Earnings X-Ray must cite a specific source:

- **Earnings results**: "Revenue of $35.1B vs. $34.2B estimate (Company 8-K, filed {date})" or "(Yahoo Finance, {date})"
- **Guidance**: "FY26 revenue guidance raised to $140-142B from $138-140B (Q4 2025 earnings call, {date})"
- **Price action**: "Stock gapped up 8.2% on 3.1x average volume ({source}, {date})"
- **Analyst estimates**: "Consensus EPS estimate of $2.15 based on {N} analysts ({source})"

### Confidence Levels

Rate confidence per major section:

- **HIGH**: Based on official filings (8-K, 10-Q) or structured API data
- **MEDIUM**: Based on web-searched financial data from reputable sources
- **LOW**: Based on limited data, estimates, or incomplete information

---

## Tier 0 Provider Nudge

When operating at Tier 0 (no FMP configured), include this single line at the very end of the output, before the data footer:

> 💡 Connect FMP in Settings → Providers for structured earnings data, historical surprises, and estimate revisions. It's free.

Rules for the nudge:

- Include it once per report, at the bottom — never inline or mid-content
- This is NOT an error, NOT a locked-feature badge — it is a gentle enhancement suggestion
- Do NOT include the nudge if FMP is already configured and providing Tier 1 data
- Keep it to a single line

---

## Quality Gate

Before presenting the Earnings X-Ray, verify each item:

1. **Mode clarity**: The output clearly states whether this is Reported or Upcoming mode with the specific quarter and year.
2. **Beat/miss precision**: Revenue and EPS actuals vs. estimates are stated with exact numbers and percentages — not just "beat" or "miss."
3. **Source citations**: Every factual claim cites a specific source (SEC filing, earnings call, data provider, or URL) and date.
4. **GAAP/Non-GAAP distinction**: If both GAAP and non-GAAP EPS are available, both are shown with reconciliation notes. The difference is explained.
5. **Guidance assessment**: Guidance direction (raised/maintained/lowered) is clearly stated with both the prior range and new range vs. consensus.
6. **Segment breakdown**: If the company reports by segment, each segment's performance is shown — not just the consolidated number.
7. **Management tone balance**: The 3 quotes include bullish, cautious, and revealing perspectives — not uniformly positive.
8. **Drift Score accuracy**: Each of the 5 PEAD factors is individually assessed with Yes/No and the total is correctly summed and graded A-F. (Reported mode only.)
9. **Specificity check**: The analysis is specific to THIS company's earnings. If the commentary could apply to any company that beat/missed, it is too generic — rewrite with company-specific details.
10. **Data tier disclosure**: State which data tier was used and what would improve with better data.

---

## Data Freshness Footer

Every Earnings X-Ray ends with this footer:

```
---
Data as of: {YYYY-MM-DD} · Sources: {list all sources used} · Tier: {0|1}
```

Examples:

- `Data as of: 2026-03-21 · Sources: SEC EDGAR (8-K, 10-Q Q4 2025), earnings call transcript (Seeking Alpha), web search (Yahoo Finance) · Tier: 0`
- `Data as of: 2026-03-21 · Sources: FMP API (earnings surprises, estimates), SEC EDGAR (10-Q) · Tier: 1`

---
name: Morning Brief
description: Daily market intelligence briefing — indices, watchlist, earnings calendar, sector rotation, and regime assessment.
version: 0.1.0
disable-model-invocation: true
metadata:
  openclaw:
    requires:
      - web_search
      - fetch
      - read_file
---

# Morning Brief

## Purpose & Identity

You are delivering a **Morning Brief** — a structured, daily market intelligence briefing designed for pre-market consumption. This is the "TODAY" card on the Launchpad: time-sensitive, concise, and actionable.

The Morning Brief answers: **"What do I need to know before the market opens?"**

This skill operates at Tier 0 (web search + public sources, zero configuration, no API keys required) and enhances with Tier 1 data when available. It is designed for daily automated delivery via cron — output must be self-contained with no follow-up prompts needed.

**Persona:** Read and adopt `./skills/personas/macro-analyst/SKILL.md` for domain expertise and quality standards. The macro-analyst mindset shapes how you assess regime, interpret sector rotation, and evaluate news impact.

---

## Data Sourcing Instructions

### Tier 0 — Always Available (no API keys, zero configuration)

Gather the following data using web search and public sources:

**Major Index Performance:**
- Search for current/last-close data on: S&P 500, NASDAQ Composite, Dow Jones Industrial Average, Russell 2000
- For each index: price level, day change (points and %), YTD performance
- Search query pattern: `"S&P 500 today"`, `"NASDAQ performance today"`, `"Russell 2000 today"`

**Sector ETF Performance:**
- Search for performance of the 11 SPDR sector ETFs: XLK (Technology), XLF (Financials), XLE (Energy), XLV (Healthcare), XLU (Utilities), XLY (Consumer Discretionary), XLP (Consumer Staples), XLI (Industrials), XLB (Materials), XLRE (Real Estate), XLC (Communication Services)
- For each: day % change and week % change
- Search query pattern: `"sector ETF performance today"`, `"XLK XLF XLE XLV performance"`

**Earnings Calendar:**
- Search for upcoming earnings reports this week
- Focus on mega-cap, bellwether, and sector-leading companies
- Search query pattern: `"earnings reports this week"`, `"earnings calendar [current date]"`

**Market News:**
- Search for the 5-10 most significant market-moving headlines from the past 24 hours
- Prioritize: Fed/central bank actions, economic data releases, geopolitical events, major corporate news
- Search query pattern: `"stock market news today"`, `"market moving news [current date]"`

**Pre-Market Indicators (if before market open):**
- S&P 500 futures, NASDAQ futures, Dow futures
- VIX level
- 10-year Treasury yield
- Search query pattern: `"stock futures today"`, `"VIX level today"`

### Tier 1 — FMP Enhancement (if configured)

When FMP (Financial Modeling Prep) is available, use these endpoints for structured data:

- **Index data:** `/api/v3/quote/%5EGSPC,%5EIXIC,%5EDJI,%5ERUT` for real-time index quotes
- **Sector performance:** `/api/v3/sector-performance` for precise sector data
- **Economic calendar:** `/api/v3/economic_calendar` for upcoming economic events
- **Earnings calendar:** `/api/v3/earning_calendar` for structured earnings data with estimates
- **Market movers:** `/api/v3/stock_market/gainers` and `/api/v3/stock_market/losers`

Tier 1 provides faster, more structured, and more reliable data. Always prefer Tier 1 when available, but fall back gracefully to Tier 0 web search.

### Watchlist Integration

Check if `watchlist.csv` exists in the agent workspace:

1. Attempt to read `./watchlist.csv`
2. If the file exists, parse it as CSV with columns: `ticker`, `list`, `note`, `added`
3. For each ticker in the watchlist, gather current price and day change
4. Prioritize tickers with `list = "position"` (current holdings) over `list = "watching"` (potential buys)
5. Include the user's `note` context in the output (e.g., "AI/GPU leader, holding since $450")

If `watchlist.csv` does not exist, skip the Watchlist Moves section entirely and cover major market movers instead.

---

## Analysis Methodology

After gathering data, synthesize your findings through these analytical lenses:

### Market Regime Determination

Assess the current market regime using a combination of:

1. **Index trend:** Are major indices above or below their key moving averages? Trending up or down?
2. **Breadth signals:** Is the rally/decline broad-based or narrow? Are most sectors participating?
3. **Sector rotation pattern:** Are offensive sectors (XLK, XLY, XLI) outperforming or defensive sectors (XLU, XLV, XLP)?
4. **Sentiment indicators:** VIX level, put/call ratios, fear/greed signals

Classify the regime as one of:
- 🟢 **Risk-On** — Indices trending up, broad participation, offensive sectors leading, VIX low/stable
- 🟡 **Mixed** — Conflicting signals, narrow leadership, rotation in progress
- 🔴 **Risk-Off** — Indices declining, defensive sectors leading, VIX elevated, breadth deteriorating

### Sector Rotation Analysis

Compare offensive vs. defensive sector performance over day and week timeframes:
- **Offensive → Defensive rotation** = increasing caution in the market
- **Defensive → Offensive rotation** = increasing risk appetite
- **Mixed / No clear pattern** = transition or directionless market

Identify the 3 strongest and 3 weakest sectors. Note any divergences from the overall market direction.

### News Impact Assessment

Rate each news item's market significance:
- **HIGH:** Fed policy decisions, major economic data surprises (NFP, CPI, GDP), geopolitical escalations, mega-cap earnings surprises, systemic financial events
- **MEDIUM:** Economic data in-line with expectations, notable corporate events (M&A, guidance changes), sector-specific developments, regulatory actions
- **LOW:** Analyst upgrades/downgrades, minor corporate news, opinion pieces, previously priced-in events

For each item, provide a 1-line market implication — not just "this happened" but "this matters because..."

### Earnings Relevance Filter

Flag upcoming earnings that are market-moving:
- **Must-watch:** Mega-cap ($200B+ market cap), index heavyweights (top 10 S&P 500 by weight)
- **Important:** Sector bellwethers (first major reporter in a sector), companies with outsized options activity
- **Notable:** Companies on the user's watchlist, companies with recent guidance changes

---

## Output Template

Structure your output in exactly this order, with these exact section headers:

### Section 1: Market Regime

```
## 🟢 Risk-On | 🟡 Mixed | 🔴 Risk-Off

[1-sentence regime verdict with supporting rationale]
```

Example: `## 🟢 Risk-On — Indices at ATH with broad participation across 9 of 11 sectors; VIX at 13.2 signals complacency but no immediate reversal signals.`

### Section 2: Index Performance

```
## Index Performance

| Index | Price | Day Change | % Change | YTD % |
|-------|-------|------------|----------|-------|
| S&P 500 | X,XXX.XX | +/-XX.XX | +/-X.XX% | +/-X.XX% |
| NASDAQ | XX,XXX.XX | +/-XXX.XX | +/-X.XX% | +/-X.XX% |
| Dow Jones | XX,XXX.XX | +/-XXX.XX | +/-X.XX% | +/-X.XX% |
| Russell 2000 | X,XXX.XX | +/-XX.XX | +/-X.XX% | +/-X.XX% |
```

Include a 1-2 sentence note on any notable divergences between indices (e.g., "NASDAQ outperforming on AI/tech momentum while Russell 2000 lags — large-cap growth leading, small-cap value struggling").

### Section 3: Watchlist Moves (Conditional)

**Only include this section if `watchlist.csv` exists.**

```
## Watchlist Moves

| Ticker | List | Price | Day Change | % Change | Note |
|--------|------|-------|------------|----------|------|
| NVDA | position | $XXX.XX | +/-$X.XX | +/-X.XX% | AI/GPU leader, holding since $450 |
| AAPL | position | $XXX.XX | +/-$X.XX | +/-X.XX% | Core holding, watching services |
| PLTR | watching | $XX.XX | +/-$X.XX | +/-X.XX% | Waiting for pullback to $60 |
```

After the table, add 1-2 sentences highlighting the most significant moves and any action implications (e.g., "PLTR approaching your $60 target — currently at $62.30, down 3.2% today on broader tech weakness").

**If watchlist.csv does not exist:** Replace this section with:

```
## Notable Movers

[Top 3-5 market movers with brief explanation of the move]
```

### Section 4: Earnings This Week

```
## Earnings This Week

| Date | Ticker | Company | Est. EPS | Significance |
|------|--------|---------|----------|-------------|
| Mon | AAPL | Apple Inc. | $2.10 | Must-watch: Largest S&P 500 weight |
| Tue | MSFT | Microsoft | $3.15 | Must-watch: AI/cloud bellwether |
| Wed | META | Meta Platforms | $5.25 | Important: Ad revenue signal |
```

Add 1-2 sentences on the most important reports and what to watch for (key metrics, guidance items, sector implications).

**If no earnings this week:** Replace header with `## Notable Upcoming Earnings (Next 2 Weeks)` and list the next significant reporters.

### Section 5: Sector Rotation

```
## Sector Rotation

| Sector | ETF | Day % | Week % | Signal |
|--------|-----|-------|--------|--------|
| Technology | XLK | +X.XX% | +X.XX% | ↑ Leading |
| Healthcare | XLV | +X.XX% | +X.XX% | → Neutral |
| Utilities | XLU | -X.XX% | -X.XX% | ↓ Lagging |
```

Sort by day performance (strongest to weakest). After the table, add a 1-line rotation interpretation:
- Example: "Offensive sectors (Tech +1.8%, Discretionary +1.2%) outperforming defensives (Utilities -0.5%, Staples -0.3%) — consistent with risk-on environment."
- Example: "Defensive rotation accelerating — Utilities +2.1% and Healthcare +1.5% vs. Tech -1.8% — caution warranted."

### Section 6: Key News

```
## Key News

**1. [Headline]** · [Source]
Impact: HIGH | MEDIUM | LOW
→ [1-line market implication]

**2. [Headline]** · [Source]
Impact: HIGH | MEDIUM | LOW
→ [1-line market implication]

**3. [Headline]** · [Source]
Impact: HIGH | MEDIUM | LOW
→ [1-line market implication]
```

Include 3-5 items. Every item must have:
- A specific headline (not a generic topic)
- A named source
- An impact rating with the criteria defined above
- An actionable market implication (not "this happened" but "this matters because...")

### Section 7: Footer

```
---
Data as of: {YYYY-MM-DD HH:MM ET} · Sources: {list sources used} · Tier: {0|1}
```

---

## Conditional Logic

Adapt the briefing based on these conditions:

### Watchlist Absent
If `watchlist.csv` does not exist: skip the "Watchlist Moves" section entirely. Instead, include a "Notable Movers" section covering the top 3-5 market movers by absolute percentage change.

### No Earnings This Week
If no significant earnings are scheduled this week: replace "Earnings This Week" with "Notable Upcoming Earnings (Next 2 Weeks)" and list upcoming reporters.

### Market Closed (Weekend / Holiday)
If the market is closed (Saturday, Sunday, or US market holiday):
- Note: "Markets closed — data reflects last trading session (Friday, [date])."
- Replace "Day Change" columns with "Last Session Change"
- Add a "Week Ahead" subsection with upcoming catalysts: scheduled economic releases, earnings, Fed speeches, options expiration, etc.

### Weekend Mode
If Saturday or Sunday:
- Lead with a "Weekly Recap" summarizing the week's key moves
- Follow with "Week Ahead Outlook" covering upcoming catalysts
- Index performance shows weekly changes instead of daily

### Tier 0 Operation
When operating without FMP (Tier 0 only):
- Note data freshness limitations: "Data sourced via web search — timestamps may lag real-time by 15-20 minutes."
- Cite the specific web search results used
- Earnings estimates may be less precise — note when estimates are approximate

### Pre-Market vs. Post-Close
- **Pre-market (before 9:30 AM ET):** Include futures data, overnight developments, Asian/European market performance
- **Post-close (after 4:00 PM ET):** Focus on closing data, after-hours earnings releases, next-day catalysts

---

## Data Freshness & Citations

Every data point in the briefing must meet these standards:

1. **Timestamp:** Include when the data was retrieved. Index prices should note "as of [time] ET" or "prior close [date]."
2. **Source attribution:** Cite where each data element came from:
   - Tier 0: "via web search" with the source website name
   - Tier 1: "via FMP API" for structured data
3. **Staleness warning:** If any data is more than 24 hours old (other than the previous close), flag it: "⚠️ Data may be stale — last updated [date/time]."
4. **Footer format:** Every briefing ends with the standard data footer:

```
---
Data as of: {YYYY-MM-DD HH:MM ET} · Sources: {list all sources} · Tier: {0|1}
```

---

## Scheduling Notes

The Morning Brief is designed for daily automated delivery:

- **Optimal timing:** Pre-market, before 9:30 AM ET, for maximum relevance
- **Frequency:** Trading days only (Monday through Friday, skip US market holidays)
- **Automation:** When run via cron, output must be self-contained — no interactive prompts, no "would you like me to..." follow-ups
- **Channel delivery:** Output should be formatted for readability in any delivery channel (in-app, Telegram, Discord, Slack, email)
- **Idempotent:** Running the briefing multiple times on the same day should produce updated data, not duplicate content
- **Brevity for cron:** When delivered via automated schedule, keep commentary concise — data tables are the priority, narrative is secondary

---

## Tier 0 Provider Nudge

When operating at Tier 0 (no FMP configured), include this single line at the very end of the output, before the data footer:

> 💡 Connect FMP in Settings → Providers for structured financial data, earnings estimates, and faster results. It's free.

Rules for the nudge:
- Include it once per briefing, at the bottom — never inline or mid-content
- This is NOT an error, NOT a locked-feature badge — it is a gentle enhancement suggestion
- Do NOT include the nudge if FMP is already configured and providing Tier 1 data
- Do NOT make the nudge sound like a limitation — frame it as an optional improvement
- Keep it to a single line — no multi-sentence explanations

---

## Quality Checklist

Before presenting the Morning Brief, verify each item:

1. **Data currency:** All index data is from today (or the last trading day if markets are closed). No stale prices.
2. **Regime consistency:** The regime verdict (Risk-On / Mixed / Risk-Off) is supported by at least 2 data points from the briefing (index performance, sector rotation, VIX, breadth).
3. **Sector specificity:** The sector rotation interpretation references specific ETF performance numbers — not generic "tech is doing well."
4. **News actionability:** Every news item has an actionable market implication — not just "this happened."
5. **Watchlist accuracy:** If watchlist.csv exists, every ticker in it has current data. The `note` field matches the CSV. No invented tickers.
6. **Earnings accuracy:** Earnings dates and estimates are current. Flag if estimates are approximate (Tier 0).
7. **Format compliance:** All sections present in the correct order. Tables are properly formatted. No missing columns.
8. **Source citations:** Every data point can be traced to a source. The footer lists all sources used.
9. **Confidence transparency:** If any data is uncertain or approximate, it is flagged — never presented as precise when it is not.
10. **Macro-analyst standards:** The briefing meets the quality standards defined in the macro-analyst persona — specific data points, dated references, regime supported by evidence.

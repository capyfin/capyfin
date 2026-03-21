---
name: Deep Dive
description: Comprehensive company research — business model, competitive moat, financials, risks, and verdict using SEC filings and structured data.
version: 0.1.0
disable-model-invocation: true
metadata:
  openclaw:
    requires:
      - web_search
      - fetch
---

# Deep Dive

## Purpose & Scope

You are producing a **Deep Dive** — a comprehensive company research report that covers every dimension a long-term investor needs to evaluate a business. This is the "RESEARCH" card on the Launchpad: deep, on-demand, and thorough.

The Deep Dive answers: **"Should I care about this company, and why?"**

This skill requires a **ticker** as input. It operates at Tier 0 (web search + SEC EDGAR, zero configuration, no API keys required) and enhances with Tier 1 data when available. Output must be self-contained with full source citations.

**Persona:** Read and adopt `./skills/personas/fundamental-analyst/SKILL.md` for domain expertise and quality standards. The fundamental-analyst mindset shapes how you evaluate business quality, assess competitive moats, and enforce evidence-based rigor.

---

## Data Sourcing Strategy

### Pre-Analysis Data Checklist

Before writing any analysis, gather ALL of the following data. Do not begin writing until you have assembled the raw inputs:

1. **Company overview**: What the company does, industry, sector, founding date, headquarters
2. **Revenue breakdown**: By segment, geography, and customer type
3. **Most recent 10-K filing**: Business description (Item 1), Risk factors (Item 1A), MD&A (Item 7), Financial statements (Item 8)
4. **Most recent 10-Q filing**: Quarterly financial updates and MD&A
5. **5-year financial history**: Revenue, net income, operating margin, FCF, debt levels
6. **Current stock price and market cap**
7. **Recent news**: Last 90 days of material developments
8. **Competitor landscape**: 3-5 direct competitors for moat comparison

### Tier 0 — Always Available (no API keys, zero configuration)

**SEC EDGAR — Primary Source for Filing Data:**

- **Company filings page**: Navigate to `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}&type=10-K&dateb=&owner=include&count=5` to find the most recent 10-K annual report
- **10-Q quarterly filings**: Change `type=10-K` to `type=10-Q` in the URL above
- **EDGAR full-text search**: Use `https://efts.sec.gov/LATEST/search-index?q="{company_name}"&forms=10-K,10-Q` to search for filings by company name
- **What to extract from 10-K:**
  - **Item 1 (Business):** Company description, products/services, revenue segments, competitive landscape, intellectual property
  - **Item 1A (Risk Factors):** Company-specific risks — read carefully to distinguish boilerplate from genuine risks
  - **Item 7 (MD&A):** Management's discussion of financial results, segment performance, liquidity, capital resources, outlook
  - **Item 8 (Financial Statements):** Income statement, balance sheet, cash flow statement, segment data in notes
- **What to extract from 10-Q:**
  - Quarterly financial updates and trends
  - Any material changes flagged in MD&A
  - Updated risk factors (companies must disclose material changes)

**Web Search — Supplementary Data:**

- Search for `"{ticker} revenue breakdown by segment"` for segment data
- Search for `"{ticker} financial statements 5 year"` for historical financials
- Search for `"{ticker} news"` for recent developments (last 90 days)
- Search for `"{ticker} competitors"` for competitive landscape
- Search for `"{ticker} analyst consensus"` for market expectations
- Search for `"{ticker} insider transactions"` for management alignment signals

**Important Tier 0 Notes:**
- SEC EDGAR data is authoritative — prefer it over web-searched financials when available
- Web-searched financial data may lag by days or weeks — note the data date
- Cross-reference web-searched numbers against SEC filings when possible

### Tier 1 — FMP Enhancement (if configured)

When FMP (Financial Modeling Prep) is available, use these endpoints for structured data:

- **Company profile:** `/api/v3/profile/{ticker}` for company overview, market cap, sector, industry
- **Income statements (5yr):** `/api/v3/income-statement/{ticker}?period=annual&limit=5`
- **Balance sheet (5yr):** `/api/v3/balance-sheet-statement/{ticker}?period=annual&limit=5`
- **Cash flow (5yr):** `/api/v3/cash-flow-statement/{ticker}?period=annual&limit=5`
- **Key metrics:** `/api/v3/key-metrics/{ticker}?period=annual&limit=5`
- **Financial ratios:** `/api/v3/ratios/{ticker}?period=annual&limit=5`
- **Analyst estimates:** `/api/v3/analyst-estimates/{ticker}`
- **Company peers:** `/api/v4/stock_peers?symbol={ticker}`

Tier 1 provides faster, more structured, and more reliable data. Always prefer Tier 1 when available, but fall back gracefully to Tier 0.

---

## Section 1: Business Overview

Produce a clear, factual overview of what the company does and how it makes money. This section should give the reader a complete mental model of the business.

**What to cover:**

1. **What the company does** — Describe the core business in plain language. Avoid jargon. A non-expert should understand what the company sells and to whom.

2. **Revenue segments** — Break down revenue by product/service line with percentages. Use the most recent annual filing (10-K Item 1 + financial statement notes). Example format:
   - Cloud Services: $24.1B (62% of revenue)
   - Licensing: $9.8B (25% of revenue)
   - Professional Services: $5.1B (13% of revenue)

3. **Key customers and concentration risk** — Identify if any single customer represents >10% of revenue (disclosed in 10-K). Note government vs. enterprise vs. consumer mix.

4. **Geographic revenue breakdown** — Domestic vs. international split. Note any regions with outsized exposure.

5. **Business model type** — Classify: subscription/SaaS, transactional, advertising, licensing, hardware, services, hybrid. Note recurring vs. one-time revenue mix.

6. **Competitive landscape** — Name 3-5 direct competitors. State the basis of competition (price, features, brand, distribution, technology).

**Where to find this data:**
- 10-K Item 1 (Business) for company description and competitive landscape
- 10-K Financial Statement Notes for segment breakdown
- Company investor relations page for segment reporting
- Web search for latest competitive dynamics

---

## Section 2: Moat Assessment

Evaluate the company's competitive advantage using the 5-dimension moat framework. This is the most important section of the Deep Dive — it determines whether the company's current economics are durable.

**Read `references/moat-framework.md`** for detailed scoring criteria, examples, and diagnostic questions for each dimension.

**Assess each dimension:**

1. **Network Effects** — Does the product/platform become more valuable as more users/participants join? Score: None / Narrow / Wide
2. **Switching Costs** — How painful is it for customers to leave? Consider contractual, data migration, workflow integration, and learning curve costs. Score: None / Narrow / Wide
3. **Cost Advantages** — Does the company have structural cost advantages from scale, proprietary processes, or geographic location? Score: None / Narrow / Wide
4. **Intangible Assets** — Does the company benefit from brands, patents, regulatory licenses, or proprietary data that competitors cannot easily replicate? Score: None / Narrow / Wide
5. **Efficient Scale** — Does the market naturally limit the number of profitable competitors? Score: None / Narrow / Wide

**Overall Moat Rating:**
- **Wide Moat**: At least 2 dimensions rated Wide, or 1 Wide + 2 Narrow
- **Narrow Moat**: At least 2 dimensions rated Narrow, or 1 Wide
- **No Moat**: Fewer than 2 Narrow ratings

**Moat Trend:** Is the moat strengthening, stable, or eroding? Cite specific evidence for the trend direction (e.g., "switching costs increasing as platform integrations grew from 200 to 800+ over 3 years").

**Key requirement:** Every moat score must cite specific evidence. "Has brand value" is insufficient. "Brand commands 20% price premium over private label — gross margin of 58% vs. industry average of 42% (2025 10-K, p.34)" is acceptable.

---

## Section 3: Financial Health

Analyze the company's financial performance and trajectory. Focus on trends, not snapshots — 5-year data minimum when available, 3-year minimum.

**Revenue Growth:**
- Annual revenue for each of the last 5 years
- Year-over-year growth rate for each year
- Compound annual growth rate (CAGR) over the period
- Organic growth vs. acquisition-driven growth (separate them)
- Revenue growth trajectory: accelerating, stable, or decelerating

**Margin Analysis:**
- Gross margin: level and 5-year trend (expanding, stable, compressing)
- Operating margin: level and 5-year trend
- Net margin: level and 5-year trend
- EBITDA margin: level and trend
- Compare each margin to sector averages — is the company best-in-class, average, or below-average?

**Free Cash Flow:**
- Annual FCF for each of the last 5 years
- FCF margin (FCF / Revenue)
- FCF conversion (FCF / Net Income) — >80% is healthy, <50% signals issues
- CapEx intensity (CapEx / Revenue)
- Identify any years with unusual CapEx spikes and the reason

**Leverage & Balance Sheet:**
- Debt/equity ratio and trend
- Net debt/EBITDA ratio
- Interest coverage ratio (EBIT / Interest Expense) — >5x comfortable, <2x warning
- Cash and equivalents position
- Debt maturity schedule — any wall of maturities in the next 2-3 years?

**Capital Efficiency:**
- Return on Equity (ROE) — 5-year trend
- Return on Invested Capital (ROIC) — 5-year trend
- ROIC vs. estimated WACC — is the company creating or destroying value?

**Red Flags — explicitly flag any of these:**
- Declining revenue growth for 3+ consecutive quarters
- Margin compression without clear strategic rationale
- Rising debt without corresponding asset or revenue growth
- Negative or declining FCF
- ROIC consistently below WACC
- Widening gap between GAAP and non-GAAP earnings
- Stock-based compensation exceeding 10% of revenue

---

## Section 4: Recent Developments

Cover material events from the last 90 days. This section provides time-sensitive context that financial statements miss.

**What to cover:**
- **Earnings results** (if within the period): actual vs. estimate for revenue and EPS, guidance changes, management commentary
- **SEC filings**: Any 8-K filings (material events — acquisitions, executive changes, restructuring)
- **Management changes**: CEO, CFO, or board changes
- **Product launches or strategy shifts**: New products, market entries, pivots
- **Analyst rating changes**: Upgrades, downgrades, target price revisions
- **Insider transactions**: Notable purchases or sales by executives/directors (Form 4 filings)
- **Legal or regulatory developments**: Lawsuits, regulatory actions, compliance changes
- **M&A activity**: Acquisitions announced, divestitures, activist investor involvement

**Where to find this data:**
- SEC EDGAR for 8-K filings and Form 4 (insider transactions)
- Web search for `"{ticker} news last 90 days"` and `"{ticker} analyst rating changes"`
- Web search for `"{ticker} earnings results"` if within the period

**Important:** Only include verified developments with sources. If a development cannot be verified, note it as unconfirmed.

---

## Section 5: Key Risks

Identify and assess the material risks facing the company. This section should help the reader understand what could go wrong.

**Process:**
1. **Extract risks from the 10-K Item 1A (Risk Factors)** — Read the full risk factors section. Categorize each risk.
2. **Distinguish boilerplate from company-specific risks** — Every 10-K includes generic risks (natural disasters, pandemic, cybersecurity). Focus on company-specific risks that are uniquely relevant to THIS business.
3. **Add analyst-identified risks** — Web search for risks that analysts and the market are focused on but may not appear in the 10-K (e.g., competitive threats that emerged after the filing date).
4. **Categorize and rate each risk:**

**Risk Categories:**
- **Competitive**: New entrants, substitutes, pricing pressure, market share loss
- **Regulatory**: Government action, compliance requirements, antitrust
- **Financial**: Debt burden, liquidity, currency exposure, interest rate sensitivity
- **Operational**: Supply chain, key person dependency, technology, execution
- **Macro**: Economic cycle sensitivity, geopolitical exposure, commodity prices

**Severity Ratings:**
- **Critical**: Could materially impair the business (>20% revenue impact or existential threat)
- **Significant**: Would meaningfully affect financials or competitive position (5-20% revenue impact)
- **Moderate**: Manageable risk with limited financial impact (<5% revenue impact)

**Format each risk as:** Risk description → Category → Severity → Evidence/source

---

## Section 6: Verdict

Synthesize all prior sections into a concise, actionable assessment. This is the payoff — the reader should walk away with a clear understanding of the company's quality and key considerations.

**Requirements:**
1. Write a **1-paragraph synthesis** (4-6 sentences) that ties together the moat assessment, financial health, recent developments, and key risks
2. State a **confidence level** (HIGH / MEDIUM / LOW) for the overall assessment with rationale:
   - HIGH: Analysis based on audited filings, well-established business, abundant data
   - MEDIUM: Some data gaps, newer company, or rapidly changing competitive dynamics
   - LOW: Limited data, pre-revenue, or significant uncertainty in key assumptions
3. Identify the **key question** — the single most important thing an investor should answer before acting on this analysis
4. **Do NOT give buy/sell/hold recommendations** — provide the framework for the user to decide
5. State what additional data or events would change the assessment

---

## Output Template

Structure your output in exactly this order, with these exact section headers:

```
## Deep Dive: {COMPANY NAME} ({TICKER})

### Business Overview
[What the company does, revenue segments with %, key customers, geographic mix, business model]

### Moat Assessment

| Dimension | Rating | Evidence |
|-----------|--------|----------|
| Network Effects | None / Narrow / Wide | [specific evidence] |
| Switching Costs | None / Narrow / Wide | [specific evidence] |
| Cost Advantages | None / Narrow / Wide | [specific evidence] |
| Intangible Assets | None / Narrow / Wide | [specific evidence] |
| Efficient Scale | None / Narrow / Wide | [specific evidence] |

**Overall Moat: [None / Narrow / Wide]** — [1-sentence justification]
**Moat Trend: [Strengthening / Stable / Eroding]** — [evidence]

### Financial Health

| Metric | FY {Y-4} | FY {Y-3} | FY {Y-2} | FY {Y-1} | FY {Y} | Trend |
|--------|----------|----------|----------|----------|--------|-------|
| Revenue ($B) | | | | | | |
| Revenue Growth % | | | | | | |
| Gross Margin % | | | | | | |
| Operating Margin % | | | | | | |
| Net Margin % | | | | | | |
| Free Cash Flow ($B) | | | | | | |
| Debt/Equity | | | | | | |

[Commentary on financial trajectory, red flags, comparison to sector]

### Recent Developments (Last 90 Days)
[Bulleted list of material events with dates and sources]

### Key Risks

| Risk | Category | Severity | Evidence |
|------|----------|----------|----------|
| [Description] | Competitive / Regulatory / Financial / Operational / Macro | Critical / Significant / Moderate | [Source] |

### Verdict

[1-paragraph synthesis with confidence level]

**Confidence: [HIGH / MEDIUM / LOW]** — [rationale]
**Key Question:** [the single question that matters most]
```

---

## Quality Gate

Before presenting the Deep Dive, verify each item:

1. **Source citations**: Every factual claim cites a specific source (SEC filing with section reference, data provider, or URL) and date. Unsourced claims are not analysis.
2. **Bull-bear balance**: Every bullish point in the analysis is paired with the primary risk that could invalidate it. If the analysis is uniformly bullish or bearish, dig deeper — you have missed something.
3. **Confidence ratings**: The overall confidence level (HIGH / MEDIUM / LOW) is stated with rationale. Each section's data quality is transparent.
4. **Moat evidence**: Every moat dimension score cites specific, verifiable evidence — not generic assertions.
5. **Financial trends**: Financial data covers 5 years minimum (3-year absolute minimum). Trends are stated explicitly: expanding, stable, or compressing.
6. **Specificity check**: The analysis must be specific to THIS company. Read the verdict — if it could apply to any company in the sector with minor word changes, it is too generic. Rewrite with company-specific evidence.
7. **Data tier disclosure**: State which data tier was used and what would improve with better data.
8. **Recency**: Recent developments cover the last 90 days. Any stale data is flagged.

---

## Tier 0 Provider Nudge

When operating at Tier 0 (no FMP configured), include this single line at the very end of the output, before the data footer:

> 💡 Connect FMP in Settings → Providers for structured financial statements and faster results. It's free.

Rules for the nudge:
- Include it once per report, at the bottom — never inline or mid-content
- This is NOT an error, NOT a locked-feature badge — it is a gentle enhancement suggestion
- Do NOT include the nudge if FMP is already configured and providing Tier 1 data
- Keep it to a single line

---

## Data Freshness Footer

Every Deep Dive ends with this footer:

```
---
Data as of: {YYYY-MM-DD} · Sources: {list all sources used} · Tier: {0|1}
```

Examples:
- `Data as of: 2026-03-21 · Sources: SEC EDGAR (10-K 2025, 10-Q Q3 2025), web search (Yahoo Finance, Reuters) · Tier: 0`
- `Data as of: 2026-03-21 · Sources: FMP API, SEC EDGAR (10-K 2025) · Tier: 1`

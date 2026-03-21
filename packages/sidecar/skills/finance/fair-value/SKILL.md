---
name: Fair Value
description: Multi-method valuation — DCF, comparable multiples, and analyst targets to determine if a stock is cheap or rich.
version: 0.1.0
disable-model-invocation: true
metadata:
  openclaw:
    requires:
      - web_search
      - fetch
---

# Fair Value

## Purpose & Scope

You are producing a **Fair Value** analysis — a multi-method valuation report that triangulates a company's intrinsic value using three independent approaches: discounted cash flow (DCF), comparable multiples, and analyst price targets.

The Fair Value analysis answers: **"Is this stock cheap, fairly valued, or expensive?"**

This skill requires a **ticker** as input. It operates at Tier 0 (web search + SEC EDGAR, zero configuration, no API keys required) and enhances with Tier 1 data when available. Output must state all assumptions explicitly so the reader can stress-test the conclusions.

**Persona:** Read and adopt `./skills/personas/fundamental-analyst/SKILL.md` for domain expertise and quality standards. The fundamental-analyst mindset ensures every valuation is grounded in evidence, assumptions are stated explicitly, and limitations are acknowledged.

---

## Data Sourcing Strategy

### Pre-Analysis Data Checklist

Before writing any analysis, gather ALL of the following inputs. Do not begin the valuation until you have assembled the raw data:

1. **Current stock price** and market capitalization
2. **Shares outstanding** (diluted, from most recent filing)
3. **Revenue** — trailing twelve months (TTM) and last 5 annual periods
4. **EBITDA** — TTM and last 5 annual periods
5. **Net income** — TTM and last 5 annual periods (GAAP)
6. **Free cash flow (FCF)** — TTM and last 5 annual periods
7. **Total debt** and **cash & equivalents** (for enterprise value calculation)
8. **52-week high and low** price
9. **Trailing and forward P/E, P/S, EV/EBITDA** multiples
10. **Analyst consensus estimates** — revenue and EPS for next 2 fiscal years
11. **Analyst price targets** — low, median, high, and number of analysts
12. **3-5 peer company tickers** for comparable analysis
13. **Sector/industry** for WACC benchmark selection

### Tier 0 — Always Available (no API keys, zero configuration)

**SEC EDGAR — Primary Source for Financial Statements:**

- **Company filings page**: Navigate to `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}&type=10-K&dateb=&owner=include&count=5` to find the most recent 10-K annual report
- **10-Q quarterly filings**: Change `type=10-K` to `type=10-Q` for quarterly data
- **What to extract for valuation:**
  - **Income Statement**: Revenue, COGS, operating expenses, interest expense, net income, tax rate
  - **Cash Flow Statement**: Operating cash flow, capital expenditures (for FCF calculation), depreciation & amortization
  - **Balance Sheet**: Total debt, cash & equivalents, shares outstanding, total equity
  - **Financial Statement Notes**: Stock-based compensation detail, segment revenue, working capital components

**Web Search — Supplementary Data:**

- Search for `"{ticker} stock price"` for current price and market cap
- Search for `"{ticker} PE ratio EV/EBITDA"` for current multiples
- Search for `"{ticker} analyst price target"` for consensus targets
- Search for `"{ticker} financial statements 5 year"` for historical data
- Search for `"{ticker} competitors peers"` to identify comparable companies
- Search for `"{ticker} analyst estimates earnings"` for forward estimates
- Search for `"{ticker} 52 week high low"` for trading range
- Search for `"{ticker} WACC"` for discount rate benchmarks

**Important Tier 0 Notes:**
- SEC filing financials are authoritative — prefer them over web-searched numbers
- Web-searched estimates may be stale — note the data date
- At Tier 0, some data points (exact analyst consensus, peer multiples) may be approximate — flag this clearly

### Tier 1 — FMP Enhancement (if configured)

When FMP (Financial Modeling Prep) is available, use these endpoints for structured data:

- **Current quote:** `/api/v3/quote/{ticker}` for real-time price, market cap, PE, 52-week range
- **Income statements (5yr):** `/api/v3/income-statement/{ticker}?period=annual&limit=5`
- **Cash flow (5yr):** `/api/v3/cash-flow-statement/{ticker}?period=annual&limit=5`
- **Balance sheet:** `/api/v3/balance-sheet-statement/{ticker}?period=annual&limit=5`
- **Key metrics:** `/api/v3/key-metrics/{ticker}?period=annual&limit=5` for EV/EBITDA, P/E, P/S, FCF yield
- **Analyst estimates:** `/api/v3/analyst-estimates/{ticker}` for consensus revenue and EPS estimates
- **Company peers:** `/api/v4/stock_peers?symbol={ticker}` for comparable companies
- **DCF value:** `/api/v3/discounted-cash-flow/{ticker}` for a reference DCF (compare to your own)

Tier 1 provides faster, more structured, and more reliable financial data. DCF inputs are significantly more reliable with Tier 1 data. Always prefer Tier 1 when available, but fall back gracefully to Tier 0.

---

## Section 1: Current Price vs. Estimates

Establish where the stock trades relative to the market's expectations and its own historical valuation.

**What to cover:**

1. **Current price and market cap** — State the current stock price, fully diluted shares outstanding, and market capitalization.

2. **Enterprise value** — Calculate: Market Cap + Total Debt - Cash & Equivalents. This is the true cost of acquiring the entire business.

3. **52-week range context** — Where the current price sits relative to the 52-week high and low. Calculate the distance from each:
   - `Distance from high: (Current - High) / High × 100`
   - `Distance from low: (Current - Low) / Low × 100`

4. **Current multiples:**
   - Trailing P/E (price / TTM EPS)
   - Forward P/E (price / estimated next-year EPS)
   - P/S (price / TTM revenue per share, or market cap / TTM revenue)
   - EV/EBITDA (enterprise value / TTM EBITDA)

5. **Historical multiple comparison** — Compare current multiples to the company's own 5-year average. Is the stock trading at a premium or discount to its historical valuation?
   - If current P/E is 30x and 5-year average is 25x, the stock trades at a 20% premium to historical norms

6. **Consensus analyst estimate** — Mean and median analyst price target. Number of analysts covering. How far is the current price from the consensus target?

---

## Section 2: DCF Valuation

Perform a bottom-up discounted cash flow analysis to estimate intrinsic value.

**Read `references/dcf-methodology.md`** for the step-by-step DCF process, WACC derivation, and sector-specific benchmarks.

**Step-by-step instructions:**

1. **Gather the base FCF** — Use the most recent annual free cash flow (Operating Cash Flow minus Capital Expenditures) from the latest 10-K filing or FMP data. If FCF is negative or distorted, use normalized FCF with an explanation.

2. **Estimate the revenue growth rate:**
   - Start with the historical 3-5 year revenue CAGR as a baseline
   - Cross-check against analyst consensus growth estimates
   - **Cap projected growth at 15%** for projection sanity — even if historical growth was higher. Companies rarely sustain >15% growth for 5+ years
   - Taper the growth rate in outer years: if base growth is 12%, use 12%, 11%, 10%, 8%, 6% over the 5-year projection

3. **Estimate FCF margin trajectory** — Will FCF margins expand (operating leverage), stay stable, or compress (increased investment)? Use the 5-year FCF margin trend as baseline.

4. **Derive WACC** — Use the methodology in `references/dcf-methodology.md`:
   - Cost of equity via CAPM: Risk-free rate + Beta × Equity Risk Premium
   - Cost of debt: Interest Expense / Total Debt × (1 - Tax Rate)
   - Weight by capital structure (market value of equity vs. book value of debt)
   - Use the sector-specific WACC benchmark from the reference doc as a sanity check

5. **Project 5 years of FCF** — Year-by-year projections showing revenue, FCF margin, and resulting FCF for each year. Show the build-up clearly.

6. **Calculate terminal value** — Use the perpetuity growth method:
   - `TV = FCF_Year5 × (1 + g) / (WACC - g)`
   - Terminal growth rate (g): typically 2-3%, never above long-term GDP growth
   - If terminal value exceeds 75% of total present value, flag it as a warning — the valuation is highly sensitive to terminal assumptions

7. **Discount to present value** — Discount each year's FCF and the terminal value to present value using WACC:
   - `PV = FCF_t / (1 + WACC)^t`

8. **Calculate per-share fair value:**
   - `Fair Value = (Sum of PV of FCFs + PV of Terminal Value - Net Debt) / Diluted Shares Outstanding`

9. **Build sensitivity table** — Create a 3×3 table varying:
   - WACC: base case ±1% (e.g., 9%, 10%, 11%)
   - Terminal growth rate: base case ±0.5% (e.g., 2.0%, 2.5%, 3.0%)
   - Show the resulting per-share fair value for each combination (9 scenarios total)

10. **State all assumptions explicitly** — Growth rates, FCF margins, WACC components, terminal growth rate, tax rate. The reader must be able to reconstruct and challenge the DCF.

11. **Note limitations** — DCF works best for companies with predictable cash flows. Note if the company is pre-revenue, highly cyclical, or has volatile FCF — the DCF result may be unreliable.

---

## Section 3: Comparable Multiples

Value the company by comparing its multiples to peer companies. This provides a market-based cross-check against the DCF.

**Step-by-step instructions:**

1. **Select 3-5 peer companies:**
   - Same sector and similar business model
   - Comparable in size (within 0.5x-2x market cap range, ideally)
   - Similar growth and profitability profile
   - Explain why each peer was selected and note any key differences

2. **Gather multiples for each peer:**
   - EV/EBITDA (most useful for capital-structure-neutral comparison)
   - P/E (trailing and forward)
   - P/S (most useful for high-growth or unprofitable companies)

3. **Calculate the peer median** for each multiple

4. **Calculate implied fair value** at peer median multiples:
   - `Implied Price (EV/EBITDA) = (Peer Median EV/EBITDA × Company EBITDA - Net Debt) / Shares Outstanding`
   - `Implied Price (P/E) = Peer Median P/E × Company EPS`
   - `Implied Price (P/S) = Peer Median P/S × Company Revenue Per Share`

5. **Note which peers are most and least comparable** — A peer in the same industry but with 3x higher growth deserves a higher multiple. Adjust qualitatively.

6. **State the implied fair value range** from the comparable analysis

**Table format:**

```
| Ticker | Company | EV/EBITDA | P/E (Fwd) | P/S | Notes |
|--------|---------|-----------|-----------|-----|-------|
| PEER1  | Name    | XX.Xx     | XX.Xx     | X.Xx | [key difference] |
| PEER2  | Name    | XX.Xx     | XX.Xx     | X.Xx | [key difference] |
| PEER3  | Name    | XX.Xx     | XX.Xx     | X.Xx | [key difference] |
| Median |         | XX.Xx     | XX.Xx     | X.Xx | |
| {TICKER} | Target | XX.Xx   | XX.Xx     | X.Xx | |
| Implied Price |  | $XXX     | $XXX      | $XXX | |
```

---

## Section 4: Analyst Price Targets

Summarize the professional analyst community's view of the stock's value.

**What to cover:**

1. **Price target range:**
   - Low target: $XXX
   - Median target: $XXX
   - High target: $XXX
   - Current price distance from median: +/-X%

2. **Number of analysts covering** — More analysts = higher confidence in consensus. <5 analysts = take targets with more skepticism.

3. **Rating distribution:**
   - Strong Buy / Buy: X analysts
   - Hold: X analysts
   - Sell / Strong Sell: X analysts

4. **Recent target revisions** — Have targets been revised up or down in the last 30-60 days? This indicates whether the analyst consensus is shifting.

5. **Context for analyst targets:**
   - Analyst targets are 12-month forward-looking
   - Sell-side analysts tend to have an optimistic bias (more buys than sells)
   - Targets are useful as a data point but should not be the primary valuation method
   - Wide dispersion between low and high targets indicates high uncertainty

---

## Section 5: Verdict

Synthesize all three valuation methods into a unified fair value assessment.

**Requirements:**

1. **State the fair value range** — Triangulate the DCF fair value, comparable-implied value, and analyst consensus into a range:
   - Example: "Trading at $185. Fair value range: $160-$210. Near midpoint of our range."

2. **Method confidence ranking** — State which valuation method has the most and least confidence for this specific company:
   - DCF is most reliable for companies with predictable FCF (mature, stable businesses)
   - Comparables are most reliable when close peers exist with similar profiles
   - Analyst targets are least reliable as a standalone method but useful as a consensus cross-check

3. **Margin of safety assessment:**
   - If current price is below the low end of the fair value range: "Potential margin of safety — price implies pessimistic assumptions"
   - If current price is within the range: "Fairly valued — price reflects reasonable assumptions"
   - If current price is above the high end: "Premium valuation — price requires optimistic assumptions to justify"

4. **Key assumptions that drive the range** — State the 2-3 assumptions that most affect the fair value. If these assumptions change, the fair value changes significantly.

5. **What would change the assessment** — Name 1-2 events or data points that would move the fair value materially (e.g., "a sustained decline in FCF margins below 15% would compress our DCF fair value by 20-30%").

6. **Do NOT give buy/sell/hold recommendations** — Provide the valuation framework. The user decides based on their own risk tolerance and portfolio context.

---

## Output Template

Structure your output in exactly this order, with these exact section headers:

```
## Fair Value: {COMPANY NAME} ({TICKER})

### Current Price vs. Estimates

| Metric | Value |
|--------|-------|
| Current Price | $XXX.XX |
| Market Cap | $XX.XB |
| Enterprise Value | $XX.XB |
| 52-Week Range | $XXX - $XXX |
| Distance from High | -X.X% |
| Trailing P/E | XX.Xx |
| Forward P/E | XX.Xx |
| P/S | X.Xx |
| EV/EBITDA | XX.Xx |
| 5-Year Avg P/E | XX.Xx |

[Commentary: current valuation vs. historical and why the premium/discount may exist]

### DCF Valuation

**Assumptions:**
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Base FCF | $X.XB | [source] |
| Revenue Growth (Yr 1-3) | X% | [rationale] |
| Revenue Growth (Yr 4-5) | X% | [tapering rationale] |
| FCF Margin | X% | [trend-based] |
| WACC | X.X% | [derivation] |
| Terminal Growth | X.X% | [rationale] |

**5-Year Projection:**
| Year | Revenue ($B) | FCF ($B) | PV of FCF ($B) |
|------|-------------|----------|----------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| Terminal Value | | | |

**DCF Fair Value: $XXX per share**

**Sensitivity Table (Fair Value per Share):**
| WACC ↓ \ Terminal Growth → | X.0% | X.5% | X.0% |
|-----------------------------|------|------|------|
| X.0% | $XXX | $XXX | $XXX |
| X.0% | $XXX | $XXX | $XXX |
| X.0% | $XXX | $XXX | $XXX |

### Comparable Multiples

| Ticker | Company | EV/EBITDA | P/E (Fwd) | P/S |
|--------|---------|-----------|-----------|-----|
| | | | | |

**Implied Fair Value from Comps: $XXX - $XXX**

### Analyst Price Targets

| Metric | Value |
|--------|-------|
| Low Target | $XXX |
| Median Target | $XXX |
| High Target | $XXX |
| # Analysts | XX |
| Buy / Hold / Sell | X / X / X |

### Verdict

[Synthesis paragraph with fair value range]

**Fair Value Range: $XXX - $XXX**
**Current Price: $XXX — [below / within / above] fair value range**
**Most Reliable Method: [DCF / Comps / Analyst Targets]** — [why]
**Key Assumptions:** [2-3 most impactful]
```

---

## Quality Gate

Before presenting the Fair Value analysis, verify each item:

1. **Assumption transparency**: Every DCF assumption (growth rate, FCF margin, WACC, terminal growth) is explicitly stated with rationale. The reader can reconstruct and challenge the model.
2. **Source citations**: Financial data cites specific sources — SEC filing (section/page), FMP API, or web search result with date. Unsourced numbers are not analysis.
3. **Sensitivity analysis**: The 3×3 sensitivity table is present and shows a meaningful range. If all 9 values cluster within 5%, the range is too narrow — widen the assumptions.
4. **Peer justification**: Each comparable company has a stated rationale for inclusion. Key differences are noted. Peer selection is not cherry-picked to support a conclusion.
5. **Limitations acknowledged**: The analysis states where the DCF is unreliable for this specific company (e.g., cyclical revenue, negative FCF, high capex period). Limitations are not generic.
6. **Bull-bear balance**: The verdict acknowledges what would make the stock cheap AND what would make it expensive. A fair value analysis that only supports one direction is incomplete.
7. **Confidence ratings**: State confidence in each valuation method (HIGH / MEDIUM / LOW) for this specific company.
8. **Data tier disclosure**: State which data tier was used and what would improve with better data.
9. **Specificity check**: The analysis must be specific to THIS company. Generic DCF assumptions that could apply to any company signal insufficient research.

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

Every Fair Value analysis ends with this footer:

```
---
Data as of: {YYYY-MM-DD} · Sources: {list all sources used} · Tier: {0|1}
```

Examples:
- `Data as of: 2026-03-21 · Sources: SEC EDGAR (10-K 2025), web search (Yahoo Finance, MarketWatch) · Tier: 0`
- `Data as of: 2026-03-21 · Sources: FMP API, SEC EDGAR (10-K 2025), analyst consensus (FactSet) · Tier: 1`

# DCF Methodology — Step-by-Step Discounted Cash Flow Valuation

## Overview

A Discounted Cash Flow (DCF) analysis estimates a company's intrinsic value by projecting its future free cash flows and discounting them to present value. The core principle: a business is worth the sum of all future cash it will generate, discounted for the time value of money and risk.

**When DCF works best:**
- Companies with positive, predictable free cash flow
- Mature businesses with established operating histories
- Companies where cash flow growth is driven by identifiable, measurable factors

**When DCF is less reliable:**
- Pre-revenue or early-stage companies (no cash flow to project)
- Highly cyclical businesses (base-year FCF may be a peak or trough)
- Companies undergoing major restructuring or transformation
- Financial institutions (cash flow mechanics differ fundamentally)

When DCF is unreliable for the specific company, state this explicitly and rely more heavily on comparable multiples and analyst targets.

---

## Step 1: Gather Financial Inputs

Collect the following data from the most recent annual filing (10-K) and trailing twelve months:

| Input | Where to Find | Notes |
|-------|--------------|-------|
| Revenue | Income Statement | TTM and last 5 annual periods |
| Cost of Goods Sold (COGS) | Income Statement | For gross margin calculation |
| Operating Expenses | Income Statement | SGA, R&D, other operating |
| Depreciation & Amortization (D&A) | Cash Flow Statement | Add back for FCF calculation |
| Capital Expenditures (CapEx) | Cash Flow Statement | "Purchases of property and equipment" |
| Changes in Working Capital | Cash Flow Statement | Or calculate from balance sheet changes |
| Interest Expense | Income Statement | For WACC cost-of-debt calculation |
| Tax Rate | Income Statement | Effective tax rate = Tax Provision / Pre-Tax Income |
| Total Debt | Balance Sheet | Short-term + long-term debt |
| Cash & Equivalents | Balance Sheet | Including short-term investments |
| Shares Outstanding (diluted) | Income Statement or 10-K cover | Use diluted, not basic |
| Stock Price | Market data | For market cap and cost of equity |
| Beta | Financial data provider or web search | For CAPM cost of equity |

---

## Step 2: Calculate Free Cash Flow

**Primary method (Operating Cash Flow approach):**
```
FCF = Operating Cash Flow − Capital Expenditures
```

Operating Cash Flow is found directly on the Cash Flow Statement. This is the most reliable method because it uses the company's own reported cash flows.

**Alternative method (build-up from EBIT):**
```
FCF = EBIT × (1 − Tax Rate) + D&A − CapEx − ΔWorking Capital
```

Use the alternative when you need to project future FCF from income statement assumptions.

**Stock-Based Compensation (SBC) consideration:**
- SBC is a real cost to shareholders (dilution) but a non-cash expense
- The cash flow statement adds SBC back in Operating Cash Flow
- For a conservative DCF, subtract SBC from FCF: `Adjusted FCF = FCF − SBC`
- At minimum, note SBC as a percentage of revenue — if >10%, the DCF overstates true cash generation

---

## Step 3: Estimate the Growth Rate

Use the following hierarchy to set revenue growth assumptions:

1. **Historical revenue CAGR (3-5 years)** — The baseline. What has the company actually achieved?
2. **Analyst consensus growth estimates** — What does the market expect for the next 1-2 years?
3. **Industry growth rate** — Is the company growing faster or slower than its market?
4. **Management guidance** — What has the company committed to? Compare guidance accuracy over 3+ years.

**Growth rate rules:**
- **Cap projected growth at 15%** for any single year. Even companies growing at 30%+ historically will decelerate. Projecting >15% for 5 years is almost always too aggressive.
- **Taper growth in outer years** toward the long-term GDP growth rate (2-3%). No company grows at double-digit rates forever.
- **Example tapering schedule for a company growing at 14% currently:**
  - Year 1: 14%, Year 2: 12%, Year 3: 10%, Year 4: 8%, Year 5: 6%
- If the company is decelerating, the taper should be steeper.
- If the company is in a hyper-growth phase (>25% YoY), be extra conservative. Companies at this growth rate have a high probability of sharp deceleration.

---

## Step 4: Derive WACC (Weighted Average Cost of Capital)

WACC represents the blended rate of return required by all capital providers (equity and debt holders). It is the discount rate for the DCF.

### Cost of Equity (CAPM)

```
Cost of Equity = Risk-Free Rate + Beta × Equity Risk Premium (ERP)
```

| Component | How to Determine | Typical Range |
|-----------|-----------------|---------------|
| Risk-Free Rate | 10-year US Treasury yield | 3.5% - 5.0% (as of 2025-2026) |
| Beta | From financial data provider or regression analysis | 0.5 - 2.0 for most stocks |
| Equity Risk Premium | Historical average or Damodaran estimate | 4.5% - 6.0% |

**Example:** Risk-free rate 4.2% + Beta 1.1 × ERP 5.5% = 4.2% + 6.05% = **10.25% cost of equity**

### Cost of Debt

```
Cost of Debt (after-tax) = (Interest Expense / Total Debt) × (1 − Tax Rate)
```

Use the effective interest rate from the income statement and balance sheet. If the company has publicly traded bonds, use the yield to maturity instead.

### WACC Calculation

```
WACC = (E / V) × Cost of Equity + (D / V) × Cost of Debt (after-tax)
```

Where:
- E = Market Value of Equity (Market Cap)
- D = Market Value of Debt (use book value as approximation)
- V = E + D (Total Enterprise Value)

---

## Step 5: Project 5 Years of Free Cash Flow

Build a year-by-year FCF projection:

```
| Year | Revenue ($B) | Growth % | FCF Margin % | FCF ($B) |
|------|-------------|----------|-------------|----------|
| Base | XX.X        | —        | XX%         | X.X      |
| 1    | XX.X        | XX%      | XX%         | X.X      |
| 2    | XX.X        | XX%      | XX%         | X.X      |
| 3    | XX.X        | XX%      | XX%         | X.X      |
| 4    | XX.X        | XX%      | XX%         | X.X      |
| 5    | XX.X        | XX%      | XX%         | X.X      |
```

**FCF Margin assumptions:**
- Use the company's historical FCF margin trajectory (expanding, stable, compressing)
- If margins have been expanding due to operating leverage, project continued but moderating expansion
- If margins are compressing due to investment, project stabilization and note when
- Compare to peer company FCF margins as a ceiling check

---

## Step 6: Calculate Terminal Value

The terminal value represents all cash flows beyond the 5-year projection period. Use the perpetuity growth method:

```
Terminal Value = FCF_Year5 × (1 + g) / (WACC − g)
```

Where `g` is the terminal growth rate (long-term sustainable growth).

**Terminal growth rate rules:**
- Typical range: 2.0% - 3.0%
- Never exceed long-term nominal GDP growth (~3-4% for developed economies)
- A terminal growth rate above 3% requires explicit justification
- For companies in declining industries, use 0-1%
- The terminal growth rate must be lower than WACC — otherwise the formula produces negative/infinite values

**Terminal value sanity check:**
- If terminal value represents >75% of total present value, the valuation is dominated by long-term assumptions and is inherently less reliable. Flag this.
- If terminal value represents >85%, the 5-year projections barely matter — the valuation is essentially a perpetuity calculation. Consider whether the DCF is the right method.

---

## Step 7: Discount to Present Value

Discount each year's FCF and the terminal value back to today:

```
PV of FCF_t = FCF_t / (1 + WACC)^t

PV of Terminal Value = Terminal Value / (1 + WACC)^5
```

Sum all discounted values:

```
Enterprise Value = PV(FCF_1) + PV(FCF_2) + PV(FCF_3) + PV(FCF_4) + PV(FCF_5) + PV(Terminal Value)
```

---

## Step 8: Calculate Per-Share Fair Value

```
Equity Value = Enterprise Value − Net Debt
            = Enterprise Value − (Total Debt − Cash & Equivalents)

Fair Value Per Share = Equity Value / Diluted Shares Outstanding
```

**Important:** Use diluted shares outstanding, not basic. Diluted includes in-the-money options and convertible securities.

---

## Step 9: Sensitivity Analysis

Build a 3×3 sensitivity table varying the two most impactful assumptions:

**Rows:** WACC at base case, base −1%, and base +1%
**Columns:** Terminal growth rate at base case, base −0.5%, and base +0.5%

```
| WACC ↓ \ Terminal Growth → | 2.0% | 2.5% | 3.0% |
|-----------------------------|------|------|------|
| 9.0%                        | $XXX | $XXX | $XXX |
| 10.0%                       | $XXX | $XXX | $XXX |
| 11.0%                       | $XXX | $XXX | $XXX |
```

The sensitivity table shows the fair value range across 9 scenarios. The spread between the lowest and highest values indicates how sensitive the valuation is to assumptions.

---

## Common Pitfalls

Avoid these frequent DCF errors:

1. **Overly optimistic growth projections** — Using recent hyper-growth as the baseline for 5 years. Revenue growth rates mean-revert. Apply the 15% cap.
2. **Ignoring working capital changes** — Growing companies often consume working capital (rising receivables and inventory). This reduces FCF.
3. **Using book value of debt instead of market value** — For WACC, market value of debt is more appropriate. Use book value only as an approximation.
4. **Terminal value domination** — If >75% of total value comes from terminal value, the DCF is more a perpetuity guess than a fundamental analysis. Flag it.
5. **Ignoring stock-based compensation** — SBC is a real cost that dilutes shareholders. Note it and adjust if material (>5% of revenue).
6. **Using inconsistent assumptions** — Revenue growth of 20% with FCF margin compression signals something is wrong. Growth and margin assumptions should tell a coherent story.
7. **Not sanity-checking the output** — Compare the DCF fair value to current market price. If the DCF says the stock is 50%+ undervalued, either you found a massive inefficiency (unlikely) or your assumptions are too aggressive. Stress-test.
8. **Circular WACC** — WACC uses market cap (equity value), but DCF calculates equity value. For simplicity, use current market cap in WACC. Note if the DCF fair value differs significantly from current price.

---

## WACC Benchmarks by Sector

Use these as sanity checks for your WACC calculation. If your derived WACC is far outside the sector range, review your inputs.

| Sector | Typical WACC Range | Notes |
|--------|-------------------|-------|
| Technology | 9% - 12% | Higher beta, minimal debt |
| Healthcare / Pharma | 8% - 11% | Moderate beta, variable leverage |
| Consumer Staples | 6% - 9% | Low beta, stable cash flows |
| Consumer Discretionary | 8% - 11% | Higher beta, cyclical |
| Financials | 8% - 12% | Complex capital structure, use with caution |
| Industrials | 7% - 10% | Moderate beta, moderate leverage |
| Energy | 8% - 12% | High beta, commodity-linked, volatile FCF |
| Utilities | 5% - 8% | Low beta, high leverage, regulated returns |
| Real Estate / REITs | 6% - 9% | High leverage, use FFO not FCF |
| Communication Services | 8% - 11% | Variable — depends on sub-sector |
| Materials | 7% - 10% | Cyclical, commodity-linked |

**Note:** These are approximate ranges for established companies. Early-stage companies or companies with unusual risk profiles may warrant higher discount rates.

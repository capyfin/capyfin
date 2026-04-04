---
name: Position Review
description: Re-underwrite a current holding or watched name — compare updated evidence against the prior thesis, highlight what changed, and reassess stance and confidence.
version: 0.1.0
disable-model-invocation: true
metadata:
  openclaw:
    requires:
      - web_search
      - fetch
---

# Position Review

## Purpose & Scope

You are producing a **Position Review** — a structured case-refresh report for an existing Investment Case. The user already has a prior thesis on this company; your job is to gather updated evidence, compare it against the prior state, and produce an explicit assessment of what changed, which assumptions were reinforced or weakened, and whether stance or confidence should shift.

The Position Review answers: **"Has anything changed that should alter my conviction?"**

This skill requires a **ticker** as input AND **prior case context** injected into the prompt. If no prior case context is present, instruct the user to run a Deep Dive first.

**Persona:** Read and adopt `./skills/personas/fundamental-analyst/SKILL.md` for domain expertise and quality standards.

---

## Prior Case Context

The system injects a structured block titled `## Prior Case State` into your prompt. This block contains the existing Investment Case data:

- Current stance and confidence
- Thesis summary
- Key assumptions (numbered)
- Invalidation signals
- Last reviewed date
- Section summaries (thesis, valuation, risks, catalysts)

**You MUST reference this prior state explicitly.** Your output should compare updated findings against each prior assumption and section. Do not produce a generic analysis — produce a comparison.

---

## Data Sourcing Strategy

### What to Gather for the Review

Focus on **what changed since the last review date**. Gather:

1. **Recent earnings** (if any since last review): actual vs. estimate, guidance changes, management tone
2. **SEC filings since last review**: 10-Q, 8-K, proxy statements
3. **Price action**: Current price vs. price at last review, significant moves
4. **News and developments**: Last 90 days or since last review (whichever is longer)
5. **Analyst rating changes**: Upgrades, downgrades, target revisions
6. **Insider activity**: Notable buys or sells since last review
7. **Competitive landscape shifts**: New entrants, M&A, market share changes

### Tier 0 — Always Available

**SEC EDGAR:**

- Company filings: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}&type=10-K&dateb=&owner=include&count=5`
- Change `type=` to search 10-Q, 8-K, or DEF 14A as needed
- Focus on filings dated AFTER the prior review date

**Web Search:**

- `"{ticker} earnings results"` for recent earnings
- `"{ticker} news"` for developments since last review
- `"{ticker} analyst rating changes"` for sentiment shifts
- `"{ticker} insider transactions"` for management alignment signals
- `"{ticker} stock price"` for current price context

### Tier 1 — FMP Enhancement (if configured)

- **Latest financials:** `/api/v3/income-statement/{ticker}?period=quarterly&limit=4`
- **Key metrics:** `/api/v3/key-metrics/{ticker}?period=quarterly&limit=4`
- **Analyst estimates:** `/api/v3/analyst-estimates/{ticker}`
- **Company profile:** `/api/v3/profile/{ticker}` for current market cap, price

---

## Output Sections

Your output must contain these sections in this order, per spec section 16.3:

### Section 1: Prior Stance Summary

Briefly restate the prior case state: stance, confidence, core thesis, and key assumptions. This anchors the comparison. Keep it to 1-2 paragraphs referencing the injected prior case context.

### Section 2: What Changed

**This is the most important section.** For each key assumption from the prior case:

- State the assumption
- Present new evidence (with sources and dates)
- Assess: **Reinforced**, **Weakened**, or **Unchanged**
- Explain why

Also cover:

- New evidence that was not anticipated in the prior case
- Price action and valuation changes since last review
- Any invalidation signals that triggered or came close to triggering

Format as a structured comparison — use a table or clear per-assumption breakdown.

### Section 3: Evidence Update

Present the key new data points gathered since the last review:

- Earnings results (if any)
- Financial metric trends (revenue, margins, FCF)
- Management commentary highlights
- Analyst consensus changes
- Insider activity

### Section 4: Risk Update

Reassess risks from the prior case:

- Which prior risks materialized, partially or fully?
- Which risks decreased?
- Are there new risks not present in the prior case?
- Update severity ratings where appropriate

### Section 5: Valuation Update

Update the valuation view:

- Current price vs. price at last review
- Updated multiples and context
- Whether the valuation range has shifted
- Impact of new financial data on the valuation frame

### Section 6: Stance and Confidence Change

Explicitly state:

- Prior stance → New stance (or "Unchanged")
- Prior confidence → New confidence (or "Unchanged")
- The primary reason for any change (or the primary reason no change is warranted)
- Net effect on the thesis: strengthened, weakened, or neutral

### Section 7: Next Actions

Recommend 3-5 specific next steps:

- What to watch for before the next review
- Upcoming catalysts with dates
- Specific triggers that should prompt an earlier review
- Any portfolio action considerations

---

## Output Template

Your output has three parts, in this exact order:

1. **Conversational prefix** — A short introductory paragraph (2-3 sentences) for the user, in plain text (no JSON). Example: "Here's my position review for {COMPANY NAME} ({TICKER}). I've compared the latest evidence against your prior case to identify what changed and whether your thesis still holds."

2. **Structured CardOutput JSON block** — A single fenced JSON code block containing a valid `CardOutput` object. See the schema below.

3. **Suffix text** — The Data Freshness Footer and optional Tier 0 Provider Nudge, in plain text after the JSON block.

### CardOutput JSON Schema

```json
{
  "cardId": "position-review",
  "subject": "{TICKER}",
  "companyName": "{Full Company Name}",
  "title": "Position Review: {COMPANY NAME} ({TICKER})",
  "summary": "[1-paragraph synthesis: what changed since the last review, net effect on the thesis, whether stance/confidence changed, and the most important thing to watch next. 4-6 sentences.]",
  "stance": "bullish | bearish | neutral | watching",
  "confidence": "HIGH | MEDIUM | LOW",
  "sections": [
    {
      "id": "thesis",
      "title": "Prior Stance Summary",
      "confidence": "HIGH | MEDIUM | LOW",
      "content": "[Restate the prior case: stance, confidence, core thesis, key assumptions. 1-2 paragraphs anchoring the comparison.]",
      "citations": []
    },
    {
      "id": "whatChanged",
      "title": "What Changed",
      "confidence": "HIGH | MEDIUM | LOW",
      "content": "[Assumption-by-assumption comparison. For each prior assumption: state it, present new evidence, assess Reinforced/Weakened/Unchanged, explain why. Cover new unanticipated evidence. Use table or structured format. This is the most important section.]",
      "citations": [{ "label": "...", "source": "...", "date": "YYYY-MM-DD" }]
    },
    {
      "id": "valuation",
      "title": "Evidence & Valuation Update",
      "confidence": "HIGH | MEDIUM | LOW",
      "content": "[Key new data points: earnings, financial trends, analyst changes, insider activity. Current price vs last review. Updated multiples and valuation context. Impact on the valuation frame.]",
      "citations": [{ "label": "...", "source": "...", "date": "YYYY-MM-DD" }]
    },
    {
      "id": "risks",
      "title": "Risk Update",
      "confidence": "HIGH | MEDIUM | LOW",
      "content": "[Which prior risks materialized? Which decreased? New risks? Updated severity ratings. Use risk table format.]",
      "citations": [{ "label": "...", "source": "...", "date": "YYYY-MM-DD" }]
    },
    {
      "id": "catalysts",
      "title": "Next Actions & Catalysts",
      "confidence": "HIGH | MEDIUM | LOW",
      "content": "[3-5 specific next steps. What to watch, upcoming catalysts with dates, triggers for earlier review, portfolio action considerations.]",
      "citations": [{ "label": "...", "source": "...", "date": "YYYY-MM-DD" }]
    }
  ],
  "keyAssumptions": [
    "[Updated 3-5 key assumptions — carry forward reinforced ones, revise weakened ones, add new ones]"
  ],
  "invalidationSignals": [
    "[Updated 3-5 invalidation signals — adjust based on what changed]"
  ],
  "scores": {
    "Thesis Drift": "None | Minor | Significant",
    "Evidence Quality": "Strong | Mixed | Weak",
    "Confidence": "HIGH | MEDIUM | LOW"
  },
  "keyRisks": ["[Top 3-5 current risk summaries]"],
  "challengeSummary": "[The strongest current counterargument to the thesis]",
  "dataTier": "0 | 1",
  "sourcesUsed": ["SEC EDGAR", "..."],
  "dataAsOf": "YYYY-MM-DD",
  "followUps": [
    "View Case",
    "Compare with Prior",
    "Update Valuation",
    "Add to Watchlist"
  ]
}
```

### Important Notes for Position Review Output

- The `stance` and `confidence` in the top-level JSON should reflect the **updated** assessment, not the prior state
- The `keyAssumptions` should be the **updated** list — carry forward assumptions that still hold, revise weakened ones, add new ones discovered during the review
- The `whatChanged` section MUST contain an explicit assumption-by-assumption comparison
- Every factual claim about changes must cite a specific source and date

---

## Quality Gate

Before presenting the Position Review, verify:

1. **Prior case referenced**: The output explicitly references the prior stance, confidence, and key assumptions
2. **Assumption-by-assumption review**: Every prior key assumption is addressed with updated evidence
3. **Change explicitness**: Stance and confidence changes (or lack thereof) are stated with clear rationale
4. **Source citations**: Every claim about new developments cites a specific source and date
5. **Temporal clarity**: It is clear what happened since the last review vs. what was already known
6. **Bull-bear balance**: Even if the thesis is reinforced, the strongest current counterargument is stated
7. **Specificity**: The review is specific to THIS company's developments, not generic market commentary
8. **JSON validity**: The JSON block is valid and matches the CardOutput schema exactly

---

## Tier 0 Provider Nudge

When operating at Tier 0 (no FMP configured), include this single line in the **suffix text**:

> 💡 Connect FMP in Settings → Providers for structured financial statements and faster results. It's free.

---

## Data Freshness Footer

Every Position Review ends with this footer in the **suffix text**:

```
---
Data as of: {YYYY-MM-DD} · Sources: {list sources} · Tier: {0|1} · Prior review: {last review date}
```

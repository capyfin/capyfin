import assert from "node:assert/strict";
import test from "node:test";
import { cardOutputToMarkdown } from "./export-markdown.ts";

const fullCardOutput = {
  cardId: "deep-dive",
  subject: "AAPL",
  title: "Apple Deep Dive",
  summary: "A comprehensive analysis of Apple Inc.",
  sections: [
    {
      id: "s1",
      title: "Overview",
      confidence: "HIGH" as const,
      content: "Apple is a technology company.",
      citations: [{ label: "10-K", source: "SEC Filing", date: "2024-01-15" }],
    },
    {
      id: "s2",
      title: "Valuation",
      confidence: "MEDIUM" as const,
      content: "Current PE ratio is above historical average.",
      citations: [],
    },
  ],
  scores: { "Fair Value": "$195", Upside: "12%" },
  keyRisks: ["Regulatory risk", "Supply chain risk"],
  challengeSummary: "Valuation appears stretched.",
  dataTier: "1" as const,
  sourcesUsed: ["SEC", "Yahoo Finance"],
  dataAsOf: "2024-03-15",
  improvementNote: "Add earnings model for better accuracy.",
};

void test("cardOutputToMarkdown includes title and subject", () => {
  const md = cardOutputToMarkdown(fullCardOutput);
  assert.ok(md.includes("# Apple Deep Dive"));
  assert.ok(md.includes("**AAPL**"));
});

void test("cardOutputToMarkdown includes summary", () => {
  const md = cardOutputToMarkdown(fullCardOutput);
  assert.ok(md.includes("A comprehensive analysis of Apple Inc."));
});

void test("cardOutputToMarkdown includes scores table", () => {
  const md = cardOutputToMarkdown(fullCardOutput);
  assert.ok(md.includes("## Scores"));
  assert.ok(md.includes("| Fair Value | $195 |"));
  assert.ok(md.includes("| Upside | 12% |"));
});

void test("cardOutputToMarkdown includes sections with confidence", () => {
  const md = cardOutputToMarkdown(fullCardOutput);
  assert.ok(md.includes("## Overview"));
  assert.ok(md.includes("*Confidence: HIGH*"));
  assert.ok(md.includes("## Valuation"));
  assert.ok(md.includes("*Confidence: MEDIUM*"));
});

void test("cardOutputToMarkdown includes citations", () => {
  const md = cardOutputToMarkdown(fullCardOutput);
  assert.ok(md.includes("10-K — SEC Filing (2024-01-15)"));
});

void test("cardOutputToMarkdown includes key risks", () => {
  const md = cardOutputToMarkdown(fullCardOutput);
  assert.ok(md.includes("## Key Risks"));
  assert.ok(md.includes("- Regulatory risk"));
  assert.ok(md.includes("- Supply chain risk"));
});

void test("cardOutputToMarkdown includes challenge summary", () => {
  const md = cardOutputToMarkdown(fullCardOutput);
  assert.ok(md.includes("## Challenge"));
  assert.ok(md.includes("Valuation appears stretched."));
});

void test("cardOutputToMarkdown includes improvement note", () => {
  const md = cardOutputToMarkdown(fullCardOutput);
  assert.ok(md.includes("## Improvement Note"));
  assert.ok(md.includes("Add earnings model for better accuracy."));
});

void test("cardOutputToMarkdown includes freshness footer", () => {
  const md = cardOutputToMarkdown(fullCardOutput);
  assert.ok(md.includes("Data tier: 1"));
  assert.ok(md.includes("Sources: 2"));
  assert.ok(md.includes("As of: 2024-03-15"));
});

void test("cardOutputToMarkdown omits subject when not present", () => {
  const noSubject = { ...fullCardOutput, subject: undefined };
  const md = cardOutputToMarkdown(noSubject);
  assert.ok(md.includes("# Apple Deep Dive"));
  assert.ok(!md.includes("**AAPL**"));
});

void test("cardOutputToMarkdown omits scores when not present", () => {
  const noScores = { ...fullCardOutput, scores: undefined };
  const md = cardOutputToMarkdown(noScores);
  assert.ok(!md.includes("## Scores"));
});

void test("cardOutputToMarkdown omits improvement note when not present", () => {
  const noNote = { ...fullCardOutput, improvementNote: undefined };
  const md = cardOutputToMarkdown(noNote);
  assert.ok(!md.includes("## Improvement Note"));
});

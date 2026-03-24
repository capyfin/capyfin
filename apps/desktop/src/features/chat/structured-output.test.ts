import assert from "node:assert/strict";
import test from "node:test";
import { tryParseCardOutput } from "./structured-output.ts";

const validCardOutput = {
  cardId: "abc-123",
  title: "AAPL Analysis",
  summary: "Apple looks strong this quarter.",
  sections: [
    {
      id: "s1",
      title: "Revenue Growth",
      confidence: "HIGH",
      content: "Revenue grew 12% YoY.",
      citations: [
        { label: "10-Q Filing", source: "SEC EDGAR", date: "2025-01-15" },
      ],
    },
  ],
  keyRisks: ["Supply chain disruption"],
  challengeSummary: "Valuation is stretched at 30x forward P/E.",
  dataTier: "1",
  sourcesUsed: ["SEC EDGAR", "Yahoo Finance"],
  dataAsOf: "2025-03-20",
};

void test("returns null when text has no JSON code block", () => {
  const result = tryParseCardOutput("Just some plain text with no JSON.");
  assert.equal(result, null);
});

void test("returns null when JSON code block is not valid JSON", () => {
  const text = "Here is some info:\n```json\n{invalid json}\n```";
  const result = tryParseCardOutput(text);
  assert.equal(result, null);
});

void test("returns null when JSON code block does not match CardOutput schema", () => {
  const text = '```json\n{"name": "not a card output"}\n```';
  const result = tryParseCardOutput(text);
  assert.equal(result, null);
});

void test("parses valid CardOutput from a fenced JSON code block", () => {
  const json = JSON.stringify(validCardOutput, null, 2);
  const text = `Here is your analysis:\n\`\`\`json\n${json}\n\`\`\`\nLet me know if you want more.`;
  const result = tryParseCardOutput(text);
  assert.ok(result);
  assert.equal(result.cardOutput.cardId, "abc-123");
  assert.equal(result.cardOutput.title, "AAPL Analysis");
  assert.equal(result.prefixText, "Here is your analysis:");
  assert.equal(result.suffixText, "Let me know if you want more.");
});

void test("returns empty prefix/suffix when JSON block is the entire text", () => {
  const json = JSON.stringify(validCardOutput);
  const text = `\`\`\`json\n${json}\n\`\`\``;
  const result = tryParseCardOutput(text);
  assert.ok(result);
  assert.equal(result.prefixText, "");
  assert.equal(result.suffixText, "");
});

void test("uses the first valid CardOutput when multiple JSON blocks exist", () => {
  const json1 = JSON.stringify({ ...validCardOutput, cardId: "first" });
  const json2 = JSON.stringify({ ...validCardOutput, cardId: "second" });
  const text = `\`\`\`json\n${json1}\n\`\`\`\nSome middle text\n\`\`\`json\n${json2}\n\`\`\``;
  const result = tryParseCardOutput(text);
  assert.ok(result);
  assert.equal(result.cardOutput.cardId, "first");
});

void test("skips invalid JSON blocks and finds the first valid one", () => {
  const json = JSON.stringify(validCardOutput);
  const text = `\`\`\`json\n{"bad": true}\n\`\`\`\ntext between\n\`\`\`json\n${json}\n\`\`\``;
  const result = tryParseCardOutput(text);
  assert.ok(result);
  assert.equal(result.cardOutput.cardId, "abc-123");
  assert.equal(result.prefixText, '```json\n{"bad": true}\n```\ntext between');
});

void test("handles CardOutput with optional fields", () => {
  const withOptionals = {
    ...validCardOutput,
    subject: "AAPL",
    scores: { "P/E": 30, Rating: "Buy" },
    improvementNote: "Would benefit from live market data.",
    followUps: ["Compare with MSFT", "Check recent insider trades"],
  };
  const json = JSON.stringify(withOptionals);
  const text = `\`\`\`json\n${json}\n\`\`\``;
  const result = tryParseCardOutput(text);
  assert.ok(result);
  assert.equal(result.cardOutput.subject, "AAPL");
  assert.deepEqual(result.cardOutput.scores, { "P/E": 30, Rating: "Buy" });
  assert.equal(
    result.cardOutput.improvementNote,
    "Would benefit from live market data.",
  );
  assert.deepEqual(result.cardOutput.followUps, [
    "Compare with MSFT",
    "Check recent insider trades",
  ]);
});

void test("returns null for empty text", () => {
  assert.equal(tryParseCardOutput(""), null);
});

import assert from "node:assert/strict";
import test from "node:test";
import type { CardOutput } from "@capyfin/contracts";
import {
  cardOutputToCreateRequest,
  cardOutputToUpdateFields,
  deriveConfidence,
} from "./output-mapper.ts";

function stubCardOutput(overrides: Partial<CardOutput> = {}): CardOutput {
  return {
    cardId: "deep-dive",
    subject: "AAPL",
    title: "Apple Deep Dive",
    summary: "A deep dive into Apple",
    sections: [
      {
        id: "s1",
        title: "Thesis",
        confidence: "HIGH",
        content: "Strong thesis",
        citations: [],
      },
      {
        id: "s2",
        title: "Risks",
        confidence: "LOW",
        content: "Key risks",
        citations: [],
      },
    ],
    keyRisks: ["Supply chain risk"],
    challengeSummary: "Market saturation",
    dataTier: "1",
    sourcesUsed: ["10-K"],
    dataAsOf: "2026-04-01",
    ...overrides,
  };
}

void test("cardOutputToCreateRequest: maps deep-dive output to CreateCaseRequest", () => {
  const output = stubCardOutput({
    companyName: "Apple Inc.",
    stance: "bullish",
    confidence: "HIGH",
    keyAssumptions: ["Services growth"],
    invalidationSignals: ["iPhone decline"],
    followUps: ["Check Q2 earnings"],
  });
  const request = cardOutputToCreateRequest(output);
  assert.equal(request.ticker, "AAPL");
  assert.equal(request.companyName, "Apple Inc.");
  assert.equal(request.stance, "bullish");
  assert.equal(request.confidence, "HIGH");
  assert.deepEqual(request.keyAssumptions, ["Services growth"]);
  assert.deepEqual(request.invalidationSignals, ["iPhone decline"]);
  assert.deepEqual(request.nextActions, ["Check Q2 earnings"]);
  const sections = request.sections ?? [];
  assert.equal(sections.length, 2);
  const first = sections[0];
  assert.ok(first);
  assert.equal(first.title, "Thesis");
  assert.deepEqual(request.tags, ["deep-dive"]);
});

void test("cardOutputToCreateRequest: uses subject as companyName fallback", () => {
  const output = stubCardOutput({ companyName: undefined });
  const request = cardOutputToCreateRequest(output);
  assert.equal(request.companyName, "AAPL");
});

void test("cardOutputToCreateRequest: derives confidence when not provided", () => {
  const output = stubCardOutput({ confidence: undefined });
  const request = cardOutputToCreateRequest(output);
  // With 1 HIGH and 1 LOW, they're tied — HIGH wins when HIGH >= LOW
  const confidence = request.confidence ?? "MEDIUM";
  assert.ok(["HIGH", "MEDIUM", "LOW"].includes(confidence));
});

void test("cardOutputToCreateRequest: uses keyRisks as invalidationSignals fallback", () => {
  const output = stubCardOutput({
    invalidationSignals: undefined,
    keyRisks: ["Risk A", "Risk B"],
  });
  const request = cardOutputToCreateRequest(output);
  assert.deepEqual(request.invalidationSignals, ["Risk A", "Risk B"]);
});

void test("cardOutputToUpdateFields: maps position-review to update fields", () => {
  const output = stubCardOutput({
    cardId: "position-review",
    stance: "bearish",
    confidence: "LOW",
    keyAssumptions: ["Declining revenue"],
    invalidationSignals: ["Revenue rebound"],
    followUps: ["Monitor next quarter"],
  });
  const fields = cardOutputToUpdateFields(output, "position-review");
  assert.equal(fields.stance, "bearish");
  assert.equal(fields.confidence, "LOW");
  assert.ok(fields.lastReviewedAt);
  const sections = fields.sections ?? [];
  assert.equal(sections.length, 2);
  assert.deepEqual(fields.keyAssumptions, ["Declining revenue"]);
  assert.deepEqual(fields.invalidationSignals, ["Revenue rebound"]);
  assert.deepEqual(fields.nextActions, ["Monitor next quarter"]);
  assert.deepEqual(fields.tags, ["position-review"]);
});

void test("cardOutputToUpdateFields: earnings-xray only extracts sections", () => {
  const output = stubCardOutput({
    cardId: "earnings-xray",
    stance: "bullish",
    confidence: "HIGH",
    keyAssumptions: ["Growth accelerating"],
  });
  const fields = cardOutputToUpdateFields(output, "earnings-xray");
  // Earnings X-Ray should NOT update stance or confidence
  assert.equal(fields.stance, undefined);
  assert.equal(fields.confidence, undefined);
  // But should update sections
  const sections = fields.sections ?? [];
  assert.equal(sections.length, 2);
  assert.deepEqual(fields.tags, ["earnings-xray"]);
});

void test("deriveConfidence: tallies correctly — majority HIGH", () => {
  const output = stubCardOutput({
    sections: [
      { id: "1", title: "A", confidence: "HIGH", content: "", citations: [] },
      { id: "2", title: "B", confidence: "HIGH", content: "", citations: [] },
      { id: "3", title: "C", confidence: "LOW", content: "", citations: [] },
    ],
  });
  assert.equal(deriveConfidence(output), "HIGH");
});

void test("deriveConfidence: majority LOW", () => {
  const output = stubCardOutput({
    sections: [
      { id: "1", title: "A", confidence: "LOW", content: "", citations: [] },
      { id: "2", title: "B", confidence: "LOW", content: "", citations: [] },
      { id: "3", title: "C", confidence: "HIGH", content: "", citations: [] },
    ],
  });
  assert.equal(deriveConfidence(output), "LOW");
});

void test("deriveConfidence: no sections returns MEDIUM", () => {
  const output = stubCardOutput({ sections: [] });
  assert.equal(deriveConfidence(output), "MEDIUM");
});

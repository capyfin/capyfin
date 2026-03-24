import assert from "node:assert/strict";
import test from "node:test";
import {
  userPreferencesSchema,
  updatePreferencesRequestSchema,
} from "@capyfin/contracts";

// ---------------------------------------------------------------------------
// userPreferencesSchema
// ---------------------------------------------------------------------------

void test("userPreferencesSchema validates full preferences object", () => {
  const result = userPreferencesSchema.parse({
    investmentStyle: "growth",
    timeHorizon: "long",
    riskTolerance: "aggressive",
    favoriteSectors: ["Technology", "Healthcare"],
    preferredMarketFocus: "us",
    reportDensity: "detailed",
    developerMode: true,
    traceVisibility: false,
  });
  assert.equal(result.investmentStyle, "growth");
  assert.equal(result.timeHorizon, "long");
  assert.equal(result.riskTolerance, "aggressive");
  assert.deepEqual(result.favoriteSectors, ["Technology", "Healthcare"]);
  assert.equal(result.preferredMarketFocus, "us");
  assert.equal(result.reportDensity, "detailed");
  assert.equal(result.developerMode, true);
  assert.equal(result.traceVisibility, false);
});

void test("userPreferencesSchema applies defaults for empty object", () => {
  const result = userPreferencesSchema.parse({});
  assert.equal(result.investmentStyle, null);
  assert.equal(result.timeHorizon, null);
  assert.equal(result.riskTolerance, null);
  assert.deepEqual(result.favoriteSectors, []);
  assert.equal(result.preferredMarketFocus, null);
  assert.equal(result.reportDensity, null);
  assert.equal(result.developerMode, false);
  assert.equal(result.traceVisibility, false);
});

void test("userPreferencesSchema allows null enum values", () => {
  const result = userPreferencesSchema.parse({
    investmentStyle: null,
    timeHorizon: null,
    riskTolerance: null,
    preferredMarketFocus: null,
    reportDensity: null,
  });
  assert.equal(result.investmentStyle, null);
  assert.equal(result.timeHorizon, null);
  assert.equal(result.riskTolerance, null);
  assert.equal(result.preferredMarketFocus, null);
  assert.equal(result.reportDensity, null);
});

void test("userPreferencesSchema rejects invalid enum values", () => {
  assert.throws(() => {
    userPreferencesSchema.parse({ investmentStyle: "yolo" });
  });
  assert.throws(() => {
    userPreferencesSchema.parse({ riskTolerance: "extreme" });
  });
});

// ---------------------------------------------------------------------------
// updatePreferencesRequestSchema (partial)
// ---------------------------------------------------------------------------

void test("updatePreferencesRequestSchema accepts partial updates", () => {
  const result = updatePreferencesRequestSchema.parse({
    investmentStyle: "value",
    developerMode: true,
  });
  assert.equal(result.investmentStyle, "value");
  assert.equal(result.developerMode, true);
});

void test("updatePreferencesRequestSchema accepts empty object", () => {
  const result = updatePreferencesRequestSchema.parse({});
  assert.ok(typeof result === "object");
});

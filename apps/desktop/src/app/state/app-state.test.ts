import assert from "node:assert/strict";
import test from "node:test";
import { appReducer, createInitialState } from "./app-state";
import type { AppState } from "./app-state";

function makeState(overrides: Partial<AppState> = {}): AppState {
  const base = createInitialState(() => "chat");
  return { ...base, ...overrides };
}

void test("FINISH_ONBOARDING sets onboardingActive to false", () => {
  const state = makeState({ onboardingActive: true });
  const next = appReducer(state, { type: "FINISH_ONBOARDING" });
  assert.equal(next.onboardingActive, false);
});

void test("FINISH_ONBOARDING does not touch hasPortfolio", () => {
  const state = makeState({ onboardingActive: true, hasPortfolio: false });
  const next = appReducer(state, { type: "FINISH_ONBOARDING" });
  assert.equal(next.hasPortfolio, false);
});

void test("HYDRATE_SUCCESS still sets hasPortfolio from payload", () => {
  const state = makeState();
  const next = appReducer(state, {
    type: "HYDRATE_SUCCESS",
    authOverview: { providers: [], connections: [], selectedProviderId: "openai" } as never,
    client: {} as never,
    sessions: [],
    hasPortfolio: true,
  });
  assert.equal(next.hasPortfolio, true);
});

void test("SET_HAS_PORTFOLIO action still works for chat-uploaded portfolios", () => {
  const state = makeState({ hasPortfolio: false });
  const next = appReducer(state, { type: "SET_HAS_PORTFOLIO", hasPortfolio: true });
  assert.equal(next.hasPortfolio, true);
});

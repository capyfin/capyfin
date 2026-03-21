import assert from "node:assert/strict";
import test from "node:test";
import { appReducer, createInitialState } from "./app-state";
import type { AppState, PendingCardPrompt } from "./app-state";

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

// ---------------------------------------------------------------------------
// Pending card prompt actions
// ---------------------------------------------------------------------------

void test("SET_PENDING_PROMPT stores the pending prompt", () => {
  const state = makeState();
  const pending: PendingCardPrompt = {
    sessionId: "s1",
    prompt: "full prompt text",
    displayLabel: "Deep Dive: NVDA",
  };
  const next = appReducer(state, { type: "SET_PENDING_PROMPT", pending });
  assert.deepEqual(next.pendingCardPrompt, pending);
});

void test("CLEAR_PENDING_PROMPT resets to null", () => {
  const state = makeState({
    pendingCardPrompt: {
      sessionId: "s1",
      prompt: "text",
      displayLabel: "Morning Brief",
    },
  });
  const next = appReducer(state, { type: "CLEAR_PENDING_PROMPT" });
  assert.equal(next.pendingCardPrompt, null);
});

void test("initial state has pendingCardPrompt as null", () => {
  const state = createInitialState(() => "launchpad");
  assert.equal(state.pendingCardPrompt, null);
});

void test("SET_PENDING_PROMPT overwrites existing pending prompt", () => {
  const state = makeState({
    pendingCardPrompt: {
      sessionId: "s1",
      prompt: "old",
      displayLabel: "Old Label",
    },
  });
  const newPending: PendingCardPrompt = {
    sessionId: "s2",
    prompt: "new",
    displayLabel: "New Label",
  };
  const next = appReducer(state, { type: "SET_PENDING_PROMPT", pending: newPending });
  assert.deepEqual(next.pendingCardPrompt, newPending);
});

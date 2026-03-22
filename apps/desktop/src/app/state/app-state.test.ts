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
    authOverview: {
      providers: [],
      connections: [],
      selectedProviderId: "openai",
    } as never,
    client: {} as never,
    sessions: [],
    hasPortfolio: true,
  });
  assert.equal(next.hasPortfolio, true);
});

void test("SET_HAS_PORTFOLIO action still works for chat-uploaded portfolios", () => {
  const state = makeState({ hasPortfolio: false });
  const next = appReducer(state, {
    type: "SET_HAS_PORTFOLIO",
    hasPortfolio: true,
  });
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
  const next = appReducer(state, {
    type: "SET_PENDING_PROMPT",
    pending: newPending,
  });
  assert.deepEqual(next.pendingCardPrompt, newPending);
});

// ---------------------------------------------------------------------------
// HYDRATE_FAILURE / REQUEST_RETRY — retry button must stay enabled after failure
// ---------------------------------------------------------------------------

void test("HYDRATE_FAILURE sets runtimeError and nulls client", () => {
  const state = makeState({ client: {} as never, runtimeError: null });
  const next = appReducer(state, {
    type: "HYDRATE_FAILURE",
    error: "Connection refused",
  });
  assert.equal(next.client, null);
  assert.equal(next.runtimeError, "Connection refused");
});

void test("HYDRATE_FAILURE preserves isLoading (HYDRATE_COMPLETE clears it)", () => {
  const state = makeState({ isLoading: true });
  const next = appReducer(state, {
    type: "HYDRATE_FAILURE",
    error: "timeout",
  });
  // isLoading should remain true — only HYDRATE_COMPLETE sets it false
  assert.equal(next.isLoading, true);
});

void test("REQUEST_RETRY increments retryToken", () => {
  const state = makeState({ retryToken: 0 });
  const next = appReducer(state, { type: "REQUEST_RETRY" });
  assert.equal(next.retryToken, 1);
});

void test("REQUEST_RETRY is idempotent — each call increments by 1", () => {
  let state = makeState({ retryToken: 0 });
  state = appReducer(state, { type: "REQUEST_RETRY" });
  state = appReducer(state, { type: "REQUEST_RETRY" });
  assert.equal(state.retryToken, 2);
});

void test("HYDRATE_START clears runtimeError for a fresh attempt", () => {
  const state = makeState({
    runtimeError: "Connection refused",
    isLoading: false,
  });
  const next = appReducer(state, { type: "HYDRATE_START" });
  assert.equal(next.runtimeError, null);
  assert.equal(next.isLoading, true);
});

void test("after failure the retry-button disabled guard resolves correctly", () => {
  // Simulates the exact condition used in ConnectionCenter:
  //   disabled={(!client && !runtimeError) || isBusy || isLoading}
  // After HYDRATE_FAILURE + HYDRATE_COMPLETE, client is null but runtimeError is set.
  let state = makeState({ isLoading: true });
  state = appReducer(state, { type: "HYDRATE_FAILURE", error: "fail" });
  state = appReducer(state, { type: "HYDRATE_COMPLETE" });

  // client is null after failure, but runtimeError is set — button must NOT be disabled
  assert.equal(state.client, null);
  assert.equal(state.runtimeError, "fail");
  assert.equal(
    state.isLoading,
    false,
    "isLoading should be false after HYDRATE_COMPLETE",
  );
});

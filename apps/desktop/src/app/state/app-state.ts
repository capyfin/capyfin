import type { AgentSession, AuthOverview } from "@capyfin/contracts";
import type { SidecarClient } from "@/lib/sidecar/client";

type AppView = "connections" | "connections-add" | "chat" | "agents";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface AppState {
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
  isLoading: boolean;
  runtimeError: string | null;
  hashView: AppView;
  retryToken: number;
  createAgentToken: number;
  sessions: AgentSession[];
  activeSessionId: string | undefined;
  hasPortfolio: boolean;
  onboardingActive: boolean;
}

export function createInitialState(readHash: () => AppView): AppState {
  return {
    authOverview: null,
    client: null,
    isLoading: true,
    runtimeError: null,
    hashView: readHash(),
    retryToken: 0,
    createAgentToken: 0,
    sessions: [],
    activeSessionId: undefined,
    hasPortfolio: false,
    onboardingActive: false,
  };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type AppAction =
  | { type: "HYDRATE_START" }
  | {
      type: "HYDRATE_SUCCESS";
      authOverview: AuthOverview;
      client: SidecarClient;
      sessions: AgentSession[];
      hasPortfolio: boolean;
    }
  | { type: "HYDRATE_FAILURE"; error: string }
  | { type: "HYDRATE_COMPLETE" }
  | { type: "SET_HASH_VIEW"; view: AppView }
  | { type: "REQUEST_RETRY" }
  | { type: "REQUEST_CREATE_AGENT" }
  | { type: "SET_SESSIONS"; sessions: AgentSession[] }
  | { type: "ADD_SESSION"; session: AgentSession }
  | { type: "REMOVE_SESSION"; sessionId: string }
  | { type: "UPDATE_SESSION_LABEL"; sessionId: string; label: string }
  | { type: "SET_ACTIVE_SESSION"; sessionId: string | undefined }
  | { type: "SET_HAS_PORTFOLIO"; hasPortfolio: boolean }
  | { type: "FINISH_ONBOARDING" }
  | { type: "SET_AUTH_OVERVIEW"; authOverview: AuthOverview | null };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "HYDRATE_START":
      return { ...state, isLoading: true, runtimeError: null };

    case "HYDRATE_SUCCESS":
      return {
        ...state,
        authOverview: action.authOverview,
        client: action.client,
        sessions: action.sessions,
        hasPortfolio: action.hasPortfolio,
        runtimeError: null,
        onboardingActive: !action.authOverview.selectedProviderId,
      };

    case "HYDRATE_FAILURE":
      return {
        ...state,
        authOverview: null,
        client: null,
        runtimeError: action.error,
      };

    case "HYDRATE_COMPLETE":
      return { ...state, isLoading: false };

    case "SET_HASH_VIEW":
      return { ...state, hashView: action.view };

    case "REQUEST_RETRY":
      return { ...state, retryToken: state.retryToken + 1 };

    case "REQUEST_CREATE_AGENT":
      return { ...state, createAgentToken: state.createAgentToken + 1 };

    case "SET_SESSIONS":
      return { ...state, sessions: action.sessions };

    case "ADD_SESSION":
      return { ...state, sessions: [action.session, ...state.sessions] };

    case "REMOVE_SESSION":
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.id !== action.sessionId),
        activeSessionId:
          state.activeSessionId === action.sessionId
            ? undefined
            : state.activeSessionId,
      };

    case "UPDATE_SESSION_LABEL":
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId ? { ...s, label: action.label } : s,
        ),
      };

    case "SET_ACTIVE_SESSION":
      return { ...state, activeSessionId: action.sessionId };

    case "SET_HAS_PORTFOLIO":
      return { ...state, hasPortfolio: action.hasPortfolio };

    case "FINISH_ONBOARDING":
      return { ...state, onboardingActive: false };

    case "SET_AUTH_OVERVIEW":
      return { ...state, authOverview: action.authOverview };
  }
}

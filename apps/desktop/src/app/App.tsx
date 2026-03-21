import { useCallback, useEffect, useReducer } from "react";
import { toast, Toaster } from "sonner";
import { AppHeader } from "@/app/shell/AppHeader";
import { AppSidebar } from "@/app/shell/AppSidebar";
import { AgentsWorkspace } from "@/features/agents/components/AgentsWorkspace";
import {
  ChatWorkspace,
  evictChatSession,
} from "@/features/chat/components/ChatWorkspace";
import { ProvidersWorkspace } from "@/features/providers/components/ProvidersWorkspace";
import { ConnectionCenter } from "@/features/onboarding/components/ConnectionCenter";
import { LaunchpadWorkspace } from "@/features/launchpad/components/LaunchpadWorkspace";
import {
  buildCardPrompt,
  buildDisplayLabel,
  makeUniqueLabel,
} from "@/features/launchpad/prompt-builder";
import type { ActionCard } from "@/features/launchpad/types";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { initializeSidecarConnection } from "@/lib/runtime/connection";
import { SidecarClient } from "@/lib/sidecar/client";
import {
  appReducer,
  createInitialState,
  type AppView,
} from "@/app/state/app-state";

export function App() {
  const [state, dispatch] = useReducer(
    appReducer,
    readViewFromHash,
    createInitialState,
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrateFromSidecar(): Promise<void> {
      if (isMounted) {
        dispatch({ type: "HYDRATE_START" });
      }

      try {
        const connection = await initializeSidecarConnection();
        const sidecarClient = SidecarClient.fromConnection(connection);
        const [overview, sessionList, portfolioStatus] = await Promise.all([
          sidecarClient.authOverview(),
          sidecarClient.listSessions("main").catch(() => ({ sessions: [] })),
          sidecarClient
            .getPortfolioStatus("main")
            .catch(() => ({ hasPortfolio: false })),
        ]);

        if (isMounted) {
          dispatch({
            type: "HYDRATE_SUCCESS",
            authOverview: overview,
            client: sidecarClient,
            sessions: sessionList.sessions,
            hasPortfolio: portfolioStatus.hasPortfolio,
          });
        }
      } catch (error) {
        console.error("Failed to initialize desktop runtime", error);
        if (isMounted) {
          dispatch({
            type: "HYDRATE_FAILURE",
            error: error instanceof Error ? error.message : "Load failed",
          });
        }
      } finally {
        if (isMounted) {
          dispatch({ type: "HYDRATE_COMPLETE" });
        }
      }
    }

    void hydrateFromSidecar();

    return () => {
      isMounted = false;
    };
  }, [state.retryToken]);

  useEffect(() => {
    const onHashChange = (): void => {
      dispatch({ type: "SET_HASH_VIEW", view: readViewFromHash() });
    };

    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const handleNewChat = useCallback(async () => {
    if (!state.client) {
      return;
    }
    try {
      const session = await state.client.createSession({ agentId: "main" });
      dispatch({ type: "ADD_SESSION", session });
      dispatch({ type: "SET_ACTIVE_SESSION", sessionId: session.id });
      window.location.hash = "#chat";
    } catch (error) {
      console.error("Failed to create new chat session", error);
    }
  }, [state.client]);

  const handleSessionSelect = useCallback((sessionId: string) => {
    dispatch({ type: "SET_ACTIVE_SESSION", sessionId });
    window.location.hash = "#chat";
  }, []);

  const handleBootstrap = useCallback((sessionId: string) => {
    dispatch({ type: "SET_ACTIVE_SESSION", sessionId });
  }, []);

  const handleSessionLabelUpdate = useCallback(
    (sessionId: string, label: string) => {
      dispatch({ type: "UPDATE_SESSION_LABEL", sessionId, label });
    },
    [],
  );

  const handleSessionRename = useCallback(
    async (sessionId: string, label: string) => {
      if (!state.client) return;
      try {
        await state.client.updateSessionLabel(sessionId, label);
        handleSessionLabelUpdate(sessionId, label);
      } catch (error) {
        console.error("Failed to rename session", error);
      }
    },
    [state.client, handleSessionLabelUpdate],
  );

  const handleSessionDelete = useCallback(
    async (sessionId: string) => {
      if (!state.client) return;
      try {
        await state.client.deleteSession(sessionId);
        evictChatSession(sessionId);
        dispatch({ type: "REMOVE_SESSION", sessionId });
      } catch (error) {
        console.error("Failed to delete session", error);
      }
    },
    [state.client],
  );

  const handleCardClick = useCallback(
    async (card: ActionCard, input?: string) => {
      if (!state.client) return;
      try {
        const prompt = buildCardPrompt(card, input);
        const baseLabel = buildDisplayLabel(card, input);
        const existingLabels = state.sessions
          .map((s) => s.label)
          .filter((l): l is string => typeof l === "string");
        const displayLabel = makeUniqueLabel(baseLabel, existingLabels);
        const session = await state.client.createSession({
          agentId: "main",
          label: displayLabel,
        });
        dispatch({ type: "ADD_SESSION", session });
        dispatch({ type: "SET_ACTIVE_SESSION", sessionId: session.id });
        dispatch({
          type: "SET_PENDING_PROMPT",
          pending: { sessionId: session.id, prompt, displayLabel },
        });
        window.location.hash = "#chat";
      } catch (error) {
        console.error("Failed to start card session", error);
        toast.error("Failed to start session. Please try again.");
      }
    },
    [state.client, state.sessions],
  );

  const handleClearPendingPrompt = useCallback(() => {
    dispatch({ type: "CLEAR_PENDING_PROMPT" });
  }, []);

  if (
    !state.authOverview?.selectedProviderId ||
    state.onboardingActive ||
    state.hashView === "providers-add"
  ) {
    const isReusableConnectionFlow =
      Boolean(state.authOverview?.selectedProviderId) &&
      !state.onboardingActive;

    return (
      <>
      <Toaster position="top-right" richColors />
      <ConnectionCenter
        authOverview={state.authOverview}
        client={state.client}
        isLoading={state.isLoading}
        runtimeError={state.runtimeError}
        onAuthOverviewChange={(overview) => {
          dispatch({ type: "SET_AUTH_OVERVIEW", authOverview: overview });
        }}
        onContinue={() => {
          dispatch({ type: "FINISH_ONBOARDING" });
          window.location.hash = "#launchpad";
        }}
        onRetry={() => {
          dispatch({ type: "REQUEST_RETRY" });
        }}
        {...(isReusableConnectionFlow
          ? {
              onClose: () => {
                window.location.hash = "#providers";
              },
            }
          : {})}
      />
      </>
    );
  }

  const currentView: Exclude<AppView, "providers-add"> = state.hashView;

  return (
    <SidebarProvider
      defaultOpen={true}
      className="!min-h-0 h-svh overflow-hidden"
    >
      <Toaster position="top-right" richColors />
      <AppSidebar
        activeSessionId={state.activeSessionId}
        activeView={currentView}
        authOverview={state.authOverview}
        onNewChat={() => {
          void handleNewChat();
        }}
        onSessionDelete={(id) => {
          void handleSessionDelete(id);
        }}
        onSessionRename={(id, label) => {
          void handleSessionRename(id, label);
        }}
        onSessionSelect={handleSessionSelect}
        sessions={state.sessions}
      />
      <SidebarInset className="min-h-0 bg-background">
        <AppHeader
          currentView={currentView}
          onAddConnection={() => {
            window.location.hash = "#providers/add";
          }}
          onCreateAgent={() => {
            dispatch({ type: "REQUEST_CREATE_AGENT" });
          }}
        />
        <div
          className={`flex min-h-0 flex-1 flex-col ${currentView === "chat" ? "" : "gap-4 overflow-y-auto p-4 lg:p-5"}`}
        >
          {currentView === "launchpad" ? (
            <LaunchpadWorkspace
              onCardClick={(card, input) => {
                void handleCardClick(card, input);
              }}
            />
          ) : currentView === "chat" ? (
            <ChatWorkspace
              authOverview={state.authOverview}
              client={state.client}
              hasPortfolio={state.hasPortfolio}
              onBootstrap={handleBootstrap}
              onClearPendingPrompt={handleClearPendingPrompt}
              onSessionLabelUpdate={handleSessionLabelUpdate}
              pendingCardPrompt={state.pendingCardPrompt}
              sessionId={state.activeSessionId}
            />
          ) : currentView === "providers" ? (
            <ProvidersWorkspace
              authOverview={state.authOverview}
              client={state.client}
              onAuthOverviewChange={(overview) => {
                dispatch({ type: "SET_AUTH_OVERVIEW", authOverview: overview });
              }}
            />
          ) : (
            <AgentsWorkspace
              authOverview={state.authOverview}
              client={state.client}
              createRequestToken={state.createAgentToken}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function readViewFromHash(): AppView {
  if (
    window.location.hash === "#providers/add" ||
    window.location.hash === "#connections/add"
  ) {
    return "providers-add";
  }

  if (
    window.location.hash === "#providers" ||
    window.location.hash === "#connections"
  ) {
    return "providers";
  }

  if (window.location.hash === "#agents") {
    return "agents";
  }

  if (window.location.hash === "#chat") {
    return "chat";
  }

  return "launchpad";
}

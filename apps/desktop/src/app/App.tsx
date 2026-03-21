import { useCallback, useEffect, useReducer } from "react";
import { AppHeader } from "@/app/shell/AppHeader";
import { AppSidebar } from "@/app/shell/AppSidebar";
import { AgentsWorkspace } from "@/features/agents/components/AgentsWorkspace";
import {
  ChatWorkspace,
  evictChatSession,
} from "@/features/chat/components/ChatWorkspace";
import { ConnectionsWorkspace } from "@/features/connections/components/ConnectionsWorkspace";
import { ConnectionCenter } from "@/features/onboarding/components/ConnectionCenter";
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

  if (
    !state.authOverview?.selectedProviderId ||
    state.onboardingActive ||
    state.hashView === "connections-add"
  ) {
    const isReusableConnectionFlow =
      Boolean(state.authOverview?.selectedProviderId) &&
      !state.onboardingActive;

    return (
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
          window.location.hash = "#chat";
          if (state.client) {
            void state.client
              .getPortfolioStatus("main")
              .then((status) => {
                dispatch({
                  type: "SET_HAS_PORTFOLIO",
                  hasPortfolio: status.hasPortfolio,
                });
              })
              .catch(() => {
                /* ignore — refreshed on next hydration */
              });
          }
        }}
        onRetry={() => {
          dispatch({ type: "REQUEST_RETRY" });
        }}
        {...(isReusableConnectionFlow
          ? {
              onClose: () => {
                window.location.hash = "#connections";
              },
            }
          : {})}
      />
    );
  }

  const currentView: Exclude<AppView, "connections-add"> = state.hashView;

  return (
    <SidebarProvider
      defaultOpen={true}
      className="!min-h-0 h-svh overflow-hidden"
    >
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
            window.location.hash = "#connections/add";
          }}
          onCreateAgent={() => {
            dispatch({ type: "REQUEST_CREATE_AGENT" });
          }}
        />
        <div
          className={`flex min-h-0 flex-1 flex-col ${currentView === "chat" ? "" : "gap-4 p-4 lg:p-5"}`}
        >
          {currentView === "chat" ? (
            <ChatWorkspace
              authOverview={state.authOverview}
              client={state.client}
              hasPortfolio={state.hasPortfolio}
              onBootstrap={handleBootstrap}
              onSessionLabelUpdate={handleSessionLabelUpdate}
              sessionId={state.activeSessionId}
            />
          ) : currentView === "connections" ? (
            <ConnectionsWorkspace
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
  if (window.location.hash === "#connections/add") {
    return "connections-add";
  }

  if (window.location.hash === "#connections") {
    return "connections";
  }

  if (window.location.hash === "#agents") {
    return "agents";
  }

  return "chat";
}

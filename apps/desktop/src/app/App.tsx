import { type AgentSession, type AuthOverview } from "@capyfin/contracts";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/app/shell/AppHeader";
import { AppSidebar } from "@/app/shell/AppSidebar";
import { AgentsWorkspace } from "@/features/agents/components/AgentsWorkspace";
import { ChatWorkspace, evictChatSession } from "@/features/chat/components/ChatWorkspace";
import { ConnectionsWorkspace } from "@/features/connections/components/ConnectionsWorkspace";
import { ConnectionCenter } from "@/features/onboarding/components/ConnectionCenter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { initializeSidecarConnection } from "@/lib/runtime/connection";
import { SidecarClient } from "@/lib/sidecar/client";
type AppView = "connections" | "connections-add" | "chat" | "agents";

export function App() {
  const [authOverview, setAuthOverview] = useState<AuthOverview | null>(null);
  const [client, setClient] = useState<SidecarClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [hashView, setHashView] = useState<AppView>(readViewFromHash());
  const [retryToken, setRetryToken] = useState(0);
  const [createAgentToken, setCreateAgentToken] = useState(0);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
  const [hasPortfolio, setHasPortfolio] = useState(false);
  const [onboardingActive, setOnboardingActive] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateFromSidecar(): Promise<void> {
      if (isMounted) {
        setIsLoading(true);
        setRuntimeError(null);
      }

      try {
        const connection = await initializeSidecarConnection();
        const client = SidecarClient.fromConnection(connection);
        const [overview, sessionList, portfolioStatus] = await Promise.all([
          client.authOverview(),
          client.listSessions("main").catch(() => ({ sessions: [] })),
          client.getPortfolioStatus("main").catch(() => ({ hasPortfolio: false })),
        ]);

        if (isMounted) {
          setAuthOverview(overview);
          setClient(client);
          setSessions(sessionList.sessions);
          setHasPortfolio(portfolioStatus.hasPortfolio);
          setRuntimeError(null);
          if (!overview.selectedProviderId) {
            setOnboardingActive(true);
          }
        }
      } catch (error) {
        console.error("Failed to initialize desktop runtime", error);
        if (isMounted) {
          setAuthOverview(null);
          setClient(null);
          setRuntimeError(error instanceof Error ? error.message : "Load failed");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void hydrateFromSidecar();

    return () => {
      isMounted = false;
    };
  }, [retryToken]);

  useEffect(() => {
    const onHashChange = (): void => {
      setHashView(readViewFromHash());
    };

    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const refreshSessions = useCallback(async () => {
    if (!client) {
      return;
    }
    try {
      const sessionList = await client.listSessions("main");
      setSessions(sessionList.sessions);
    } catch {
      // Silently ignore — sessions will refresh on next hydration
    }
  }, [client]);

  const handleNewChat = useCallback(async () => {
    if (!client) {
      return;
    }
    try {
      const session = await client.createSession({ agentId: "main" });
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      window.location.hash = "#chat";
    } catch (error) {
      console.error("Failed to create new chat session", error);
    }
  }, [client]);

  const handleSessionSelect = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    window.location.hash = "#chat";
  }, []);

  const handleBootstrap = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const handleSessionLabelUpdate = useCallback(
    (sessionId: string, label: string) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, label } : s)),
      );
    },
    [],
  );

  const handleSessionRename = useCallback(
    async (sessionId: string, label: string) => {
      if (!client) return;
      try {
        await client.updateSessionLabel(sessionId, label);
        handleSessionLabelUpdate(sessionId, label);
      } catch (error) {
        console.error("Failed to rename session", error);
      }
    },
    [client, handleSessionLabelUpdate],
  );

  const handleSessionDelete = useCallback(
    async (sessionId: string) => {
      if (!client) return;
      try {
        await client.deleteSession(sessionId);
        evictChatSession(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(undefined);
        }
      } catch (error) {
        console.error("Failed to delete session", error);
      }
    },
    [activeSessionId, client],
  );

  if (!authOverview?.selectedProviderId || onboardingActive || hashView === "connections-add") {
    const isReusableConnectionFlow = Boolean(authOverview?.selectedProviderId) && !onboardingActive;

    return (
      <ConnectionCenter
        authOverview={authOverview}
        client={client}
        isLoading={isLoading}
        runtimeError={runtimeError}
        onAuthOverviewChange={setAuthOverview}
        onContinue={() => {
          setOnboardingActive(false);
          window.location.hash = "#chat";
          if (client) {
            void client.getPortfolioStatus("main").then((status) => {
              setHasPortfolio(status.hasPortfolio);
            }).catch(() => {});
          }
        }}
        onRetry={() => {
          setRetryToken((current) => current + 1);
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

  const currentView: Exclude<AppView, "connections-add"> = hashView;

  return (
    <SidebarProvider defaultOpen={true} className="!min-h-0 h-svh overflow-hidden">
      <AppSidebar
        activeSessionId={activeSessionId}
        activeView={currentView}
        authOverview={authOverview}
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
        sessions={sessions}
      />
      <SidebarInset className="min-h-0 bg-background">
        <AppHeader
          currentView={currentView}
          onAddConnection={() => {
            window.location.hash = "#connections/add";
          }}
          onCreateAgent={() => {
            setCreateAgentToken((current) => current + 1);
          }}
        />
        <div className={`flex min-h-0 flex-1 flex-col ${currentView === "chat" ? "" : "gap-4 p-4 lg:p-5"}`}>
          {currentView === "chat" ? (
            <ChatWorkspace
              authOverview={authOverview}
              client={client}
              hasPortfolio={hasPortfolio}
              onBootstrap={handleBootstrap}
              onSessionLabelUpdate={handleSessionLabelUpdate}
              sessionId={activeSessionId}
            />
          ) : currentView === "connections" ? (
            <ConnectionsWorkspace
              authOverview={authOverview}
              client={client}
              onAuthOverviewChange={setAuthOverview}
            />
          ) : (
            <AgentsWorkspace
              authOverview={authOverview}
              client={client}
              createRequestToken={createAgentToken}
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

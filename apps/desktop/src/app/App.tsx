import { type AuthOverview } from "@capyfin/contracts";
import { useEffect, useState } from "react";
import { AppHeader } from "@/app/shell/AppHeader";
import { AppSidebar } from "@/app/shell/AppSidebar";
import { AgentsWorkspace } from "@/features/agents/components/AgentsWorkspace";
import { ChatWorkspace } from "@/features/chat/components/ChatWorkspace";
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
        const overview = await client.authOverview();

        if (isMounted) {
          setAuthOverview(overview);
          setClient(client);
          setRuntimeError(null);
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

  if (!authOverview?.selectedProviderId || hashView === "connections-add") {
    const isReusableConnectionFlow = Boolean(authOverview?.selectedProviderId);

    return (
      <ConnectionCenter
        authOverview={authOverview}
        client={client}
        isLoading={isLoading}
        runtimeError={runtimeError}
        onAuthOverviewChange={setAuthOverview}
        onContinue={() => {
          window.location.hash = "#chat";
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
    <SidebarProvider defaultOpen={true}>
      <AppSidebar activeView={currentView} authOverview={authOverview} />
      <SidebarInset className="bg-background">
        <AppHeader
          currentView={currentView}
          onAddConnection={() => {
            window.location.hash = "#connections/add";
          }}
          onCreateAgent={() => {
            setCreateAgentToken((current) => current + 1);
          }}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-5">
          {currentView === "chat" ? (
            <ChatWorkspace authOverview={authOverview} client={client} />
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

import { type AuthOverview } from "@capyfin/contracts";
import { Channel, invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { AppHeader } from "@/app/shell/AppHeader";
import { AppSidebar } from "@/app/shell/AppSidebar";
import { AgentsWorkspace } from "@/features/agents/components/AgentsWorkspace";
import { ConnectionCenter } from "@/features/onboarding/components/ConnectionCenter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidecarClient } from "@/lib/sidecar/client";
import type { SidecarConnection } from "@/app/types";

type InitStep = "sidecar_waiting" | "sidecar_ready" | "done";
type AppView = "connections" | "agents";

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
        const connection = await invoke<SidecarConnection>(
          "await_initialization",
          {
            events: new Channel<InitStep>(),
          },
        );
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

  const currentView: AppView = authOverview?.selectedProviderId
    ? hashView
    : "connections";

  if (currentView === "connections") {
    return (
      <ConnectionCenter
        authOverview={authOverview}
        client={client}
        isLoading={isLoading}
        runtimeError={runtimeError}
        onAuthOverviewChange={setAuthOverview}
        onContinue={() => {
          window.location.hash = "#agents";
        }}
        onRetry={() => {
          setRetryToken((current) => current + 1);
        }}
      />
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar activeView={currentView} authOverview={authOverview} />
      <SidebarInset className="bg-transparent">
        <AppHeader
          currentView={currentView}
          onCreateAgent={() => {
            setCreateAgentToken((current) => current + 1);
          }}
        />
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          <AgentsWorkspace
            authOverview={authOverview}
            client={client}
            createRequestToken={createAgentToken}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function readViewFromHash(): AppView {
  return window.location.hash === "#connections" ? "connections" : "agents";
}

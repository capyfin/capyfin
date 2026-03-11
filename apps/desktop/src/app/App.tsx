import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { OverviewSection } from "@/features/dashboard/components/OverviewSection";
import { navigationItems } from "@/shared/config/navigation";
import { AppShell } from "@/shared/ui/AppShell";

interface AppMetadata {
  productName: string;
  workspaceLayout: string[];
}

const browserFallback: AppMetadata = {
  productName: "CapyFin",
  workspaceLayout: ["apps/desktop", "docs", "apps/desktop/src-tauri"],
};

export function App() {
  const [metadata, setMetadata] = useState<AppMetadata>(browserFallback);

  useEffect(() => {
    let isMounted = true;

    void invoke<AppMetadata>("app_metadata")
      .then((value) => {
        if (isMounted) {
          setMetadata(value);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMetadata(browserFallback);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppShell
      eyebrow="Initial architecture"
      title="CapyFin"
      description="A Tauri workspace baseline with clear frontend and Rust boundaries, ready for the first real finance features."
      navigationItems={navigationItems}
    >
      <OverviewSection metadata={metadata} />
    </AppShell>
  );
}

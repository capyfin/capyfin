import { TrendingUpIcon, Wallet2Icon, ZapIcon } from "lucide-react";
import {
  primaryNavigation,
  secondaryNavigation,
  workspaceNavigation,
} from "@/app/config/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { AuthOverview } from "@/app/types";

interface AppSidebarProps {
  activeView: "connections" | "chat" | "agents";
  authOverview: AuthOverview | null;
}

export function AppSidebar({ activeView, authOverview }: AppSidebarProps) {
  const connectedProviderCount = authOverview?.connections.length ?? 0;

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="h-12 data-[slot=sidebar-menu-button]:!p-2"
            >
              <a href="#chat">
                <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                  <Wallet2Icon className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-semibold tracking-tight">CapyFin</span>
                  <span className="text-[11px] text-sidebar-foreground/50">
                    Wealth cockpit
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="hidden rounded-full border-sidebar-border bg-sidebar-accent px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/50 xl:inline-flex"
                >
                  Beta
                </Badge>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-3 pt-2">
        {/* Portfolio stat card — solid bg for visibility */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-3.5 group-data-[collapsible=icon]:hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/50">
                    Today
                  </p>
                  <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-sidebar-foreground">
                    +1.84%
                  </p>
                  <p className="mt-0.5 text-[11px] text-sidebar-foreground/60">
                    Broad portfolio momentum
                  </p>
                </div>
                <div className="rounded-xl bg-sidebar-primary/15 p-2 text-sidebar-primary">
                  <TrendingUpIcon className="size-4" />
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/40">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={
                      (item.href === "#connections" && activeView === "connections") ||
                      (item.href === "#chat" && activeView === "chat") ||
                      (item.href === "#agents" && activeView === "agents")
                    }
                  >
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                      {item.badge ? (
                        <Badge
                          variant="secondary"
                          className="ml-auto rounded-full px-2 text-[10px] group-data-[collapsible=icon]:hidden"
                        >
                          {item.badge}
                        </Badge>
                      ) : null}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/40">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1.5">
          <Avatar className="size-9 rounded-xl border border-sidebar-border shadow-sm">
            <AvatarFallback className="rounded-xl bg-sidebar-primary/15 text-xs font-semibold text-sidebar-primary">
              CF
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              Primary household
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/50">
              {connectedProviderCount > 0
                ? `${String(connectedProviderCount)} providers connected`
                : "Provider setup pending"}
            </p>
          </div>
          <div className="hidden rounded-xl bg-success/15 p-2 text-success group-data-[collapsible=icon]:hidden lg:block">
            <ZapIcon className="size-3.5" />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

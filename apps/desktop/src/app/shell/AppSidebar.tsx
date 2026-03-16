import { Wallet2Icon, ZapIcon } from "lucide-react";
import {
  primaryNavigation,
  secondaryNavigation,
} from "@/app/config/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="h-11 data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#chat">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wallet2Icon className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="text-[13px] font-semibold tracking-tight">
                    CapyFin
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-1 pt-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={
                      (item.href === "#connections" &&
                        activeView === "connections") ||
                      (item.href === "#chat" && activeView === "chat") ||
                      (item.href === "#agents" && activeView === "agents")
                    }
                  >
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

      <SidebarFooter>
        <div className="flex items-center gap-2.5 rounded-lg p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1">
          <Avatar className="size-7 rounded-md">
            <AvatarFallback className="rounded-md bg-primary/12 text-[10px] font-semibold text-primary">
              CF
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-[12px] font-medium text-sidebar-foreground">
              Primary household
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/45">
              {connectedProviderCount > 0
                ? `${String(connectedProviderCount)} connected`
                : "Setup pending"}
            </p>
          </div>
          {connectedProviderCount > 0 ? (
            <div className="hidden text-success group-data-[collapsible=icon]:hidden lg:block">
              <ZapIcon className="size-3" />
            </div>
          ) : null}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

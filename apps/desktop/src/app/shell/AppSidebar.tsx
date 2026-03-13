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
  activeView: "connections" | "overview";
  authOverview: AuthOverview | null;
}

export function AppSidebar({ activeView, authOverview }: AppSidebarProps) {
  const connectedProviderCount =
    authOverview?.providers.filter(
      (provider) =>
        provider.profiles.length > 0 || provider.environment.available,
    ).length ?? 0;

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border/70">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="h-12 data-[slot=sidebar-menu-button]:!p-2"
            >
              <a href="#overview">
                <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                  <Wallet2Icon className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-semibold tracking-tight">CapyFin</span>
                  <span className="text-xs text-sidebar-foreground/70">
                    Desktop wealth cockpit
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="hidden rounded-full border-sidebar-border/80 bg-sidebar-accent/70 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/70 xl:inline-flex"
                >
                  Beta
                </Badge>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/55 p-3 group-data-[collapsible=icon]:hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-sidebar-foreground/60">
                    Today
                  </p>
                  <p className="mt-2 text-lg font-semibold text-sidebar-foreground">
                    +1.84%
                  </p>
                  <p className="text-xs text-sidebar-foreground/70">
                    Broad portfolio momentum
                  </p>
                </div>
                <div className="rounded-xl bg-sidebar-primary/12 p-2 text-sidebar-primary">
                  <TrendingUpIcon className="size-4" />
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={
                      (item.href === "#connections" && activeView === "connections") ||
                      (item.href === "#overview" && activeView === "overview")
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
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
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

      <SidebarFooter className="border-t border-sidebar-border/70">
        <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/45 p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1.5">
          <Avatar className="size-9 rounded-xl border border-sidebar-border/80">
            <AvatarFallback className="rounded-xl bg-sidebar-primary/10 text-sidebar-primary">
              CF
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-medium text-sidebar-foreground">
              Primary household
            </p>
            <p className="truncate text-xs text-sidebar-foreground/65">
              {connectedProviderCount > 0
                ? `${String(connectedProviderCount)} providers connected`
                : "Provider setup pending"}
            </p>
          </div>
          <div className="hidden rounded-xl bg-emerald-500/10 p-2 text-emerald-600 group-data-[collapsible=icon]:hidden lg:block">
            <ZapIcon className="size-4" />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

import type { AgentSession } from "@capyfin/contracts";
import {
  ChevronRightIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TrashIcon,
} from "lucide-react";
import type { AppView } from "@/app/state/app-state";
import { useEffect, useMemo, useRef, useState } from "react";
import { primaryNavigation } from "@/app/config/navigation";
import capyfinLogo from "@/assets/brand/capyfin-circled.png";
import {
  SETTINGS_TABS,
  type SettingsTab,
} from "@/features/settings/components/SettingsWorkspace";
import { groupSessionsByDate } from "@/features/chat/session-grouping";
import { formatSessionLabel } from "@/features/chat/session-label";
import { formatSessionTimestamp } from "@/features/chat/session-timestamp";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  activeSessionId?: string | undefined;
  activeSettingsTab?: SettingsTab | undefined;
  activeView: Exclude<AppView, "providers-add">;
  onNewChat?: (() => void) | undefined;
  onOpenCommandPalette?: (() => void) | undefined;
  onSessionDelete?: ((sessionId: string) => void) | undefined;
  onSessionRename?: ((sessionId: string, label: string) => void) | undefined;
  onSessionSelect?: ((sessionId: string) => void) | undefined;
  sessions?: AgentSession[] | undefined;
}

export function AppSidebar({
  activeSessionId,
  activeSettingsTab,
  activeView,
  onNewChat,
  onOpenCommandPalette,
  onSessionDelete,
  onSessionRename,
  onSessionSelect,
  sessions,
}: AppSidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(activeView === "settings");
  const effectiveSettingsOpen = activeView === "settings" || settingsOpen;
  const sessionGroups = useMemo(
    () => groupSessionsByDate(sessions ?? []),
    [sessions],
  );

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
              <a href="#launchpad">
                <img
                  src={capyfinLogo}
                  alt="CapyFin"
                  className="size-8 rounded-lg object-contain"
                  draggable={false}
                />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="text-[13px] font-semibold tracking-tight">
                    CapyFin
                  </span>
                  <span className="text-[10px] text-sidebar-foreground/40">
                    Research Workstation
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Search"
                  onClick={onOpenCommandPalette}
                  className="text-sidebar-foreground/65"
                >
                  <SearchIcon />
                  <span>Search</span>
                  <kbd className="ml-auto hidden rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden lg:inline-block">
                    ⌘K
                  </kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {primaryNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={item.href === `#${activeView}`}
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

        {activeView === "chat" && sessionGroups.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            {onNewChat ? (
              <SidebarGroupAction title="New chat" onClick={onNewChat}>
                <PlusIcon />
                <span className="sr-only">New chat</span>
              </SidebarGroupAction>
            ) : null}
            <SidebarGroupContent>
              {sessionGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/65 first:pt-1">
                    {group.label}
                  </p>
                  <SidebarMenu>
                    {group.sessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        isActive={session.id === activeSessionId}
                        isEditing={editingSessionId === session.id}
                        session={session}
                        onDelete={onSessionDelete}
                        onRename={onSessionRename}
                        onSelect={onSessionSelect}
                        onStartEditing={() => {
                          setEditingSessionId(session.id);
                        }}
                        onStopEditing={() => {
                          setEditingSessionId(null);
                        }}
                      />
                    ))}
                  </SidebarMenu>
                </div>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <Collapsible
            open={effectiveSettingsOpen}
            onOpenChange={setSettingsOpen}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {SETTINGS_TABS.map((tab) => (
                    <SidebarMenuSubItem key={tab.id}>
                      <SidebarMenuSubButton
                        href={`#settings/${tab.id}`}
                        isActive={activeSettingsTab === tab.id}
                        size="sm"
                      >
                        <tab.icon className="size-4" />
                        <span>{tab.label}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip="Settings"
                  isActive={activeView === "settings" && !settingsOpen}
                >
                  <SettingsIcon />
                  <span>Settings</span>
                  <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function SessionItem({
  isActive,
  isEditing,
  session,
  onDelete,
  onRename,
  onSelect,
  onStartEditing,
  onStopEditing,
}: {
  isActive: boolean;
  isEditing: boolean;
  session: AgentSession;
  onDelete?: ((sessionId: string) => void) | undefined;
  onRename?: ((sessionId: string, label: string) => void) | undefined;
  onSelect?: ((sessionId: string) => void) | undefined;
  onStartEditing: () => void;
  onStopEditing: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const label = formatSessionLabel(session);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  function commitRename(): void {
    const value = inputRef.current?.value.trim();
    if (value && value !== label) {
      onRename?.(session.id, value);
    }
    onStopEditing();
  }

  if (isEditing) {
    return (
      <SidebarMenuItem>
        <div className="flex h-8 items-center gap-2 px-2">
          <MessageSquareIcon className="size-4 shrink-0 text-sidebar-foreground/70" />
          <input
            ref={inputRef}
            defaultValue={label}
            className="h-6 min-w-0 flex-1 rounded border border-sidebar-ring bg-sidebar px-1.5 text-sm text-sidebar-foreground outline-none focus:ring-1 focus:ring-sidebar-ring"
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitRename();
              } else if (event.key === "Escape") {
                onStopEditing();
              }
            }}
          />
        </div>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={label}
        isActive={isActive}
        className="h-auto py-1.5"
        onClick={() => {
          onSelect?.(session.id);
        }}
      >
        <MessageSquareIcon className="mt-0.5 self-start" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm">{label}</span>
          <span className="text-[11px] leading-tight text-sidebar-foreground/45">
            {formatSessionTimestamp(session.updatedAt)}
          </span>
        </div>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem
            onClick={() => {
              onStartEditing();
            }}
          >
            <PencilIcon className="mr-2 size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              onDelete?.(session.id);
            }}
          >
            <TrashIcon className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

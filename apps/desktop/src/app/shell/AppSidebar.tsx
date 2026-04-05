import type { AgentSession } from "@capyfin/contracts";
import {
  ChevronDownIcon,
  ChevronRightIcon,
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
import {
  groupSessionsByDate,
  partitionAllGroupsSessions,
} from "@/features/chat/session-grouping";
import { formatSessionLabel } from "@/features/chat/session-label";
import {
  detectSessionType,
  SESSION_TYPE_META,
} from "@/features/chat/session-type";
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
  const { namedGroups, allUnnamed } = useMemo(
    () => partitionAllGroupsSessions(sessionGroups),
    [sessionGroups],
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
              {namedGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-3 py-1.5 mt-3 first:mt-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                    {group.label}
                  </div>
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
              {allUnnamed.length > 0 ? (
                <SidebarMenu>
                  <UnnamedSessionGroup
                    sessions={allUnnamed}
                    activeSessionId={activeSessionId}
                    editingSessionId={editingSessionId}
                    onDelete={onSessionDelete}
                    onRename={onSessionRename}
                    onSelect={onSessionSelect}
                    onStartEditing={setEditingSessionId}
                    onStopEditing={() => {
                      setEditingSessionId(null);
                    }}
                  />
                </SidebarMenu>
              ) : null}
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

function UnnamedSessionGroup({
  sessions,
  activeSessionId,
  editingSessionId,
  onDelete,
  onRename,
  onSelect,
  onStartEditing,
  onStopEditing,
}: {
  sessions: AgentSession[];
  activeSessionId?: string | undefined;
  editingSessionId: string | null;
  onDelete?: ((sessionId: string) => void) | undefined;
  onRename?: ((sessionId: string, label: string) => void) | undefined;
  onSelect?: ((sessionId: string) => void) | undefined;
  onStartEditing: (id: string) => void;
  onStopEditing: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs italic text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-foreground/60 transition-colors"
          >
            <ChevronDownIcon
              className={`size-3.5 shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
            />
            <span>{sessions.length} unnamed conversations</span>
          </button>
        </CollapsibleTrigger>
      </SidebarMenuItem>
      <CollapsibleContent>
        {sessions.map((session) => (
          <SessionItem
            key={session.id}
            isActive={session.id === activeSessionId}
            isEditing={editingSessionId === session.id}
            session={session}
            onDelete={onDelete}
            onRename={onRename}
            onSelect={onSelect}
            onStartEditing={() => {
              onStartEditing(session.id);
            }}
            onStopEditing={onStopEditing}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
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
  const sessionType = detectSessionType(label);
  const typeMeta = SESSION_TYPE_META[sessionType];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
  const TypeIcon = typeMeta.icon;

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

  const iconColorClass =
    sessionType === "deep-dive"
      ? "text-blue-500"
      : sessionType === "morning-brief"
        ? "text-amber-500"
        : sessionType === "position-review"
          ? "text-green-500"
          : sessionType === "fair-value"
            ? "text-emerald-500"
            : "text-sidebar-foreground/70";

  const borderColorClass =
    sessionType === "deep-dive"
      ? "border-l-blue-500/60"
      : sessionType === "morning-brief"
        ? "border-l-amber-500/60"
        : sessionType === "position-review"
          ? "border-l-green-500/60"
          : sessionType === "fair-value"
            ? "border-l-emerald-500/60"
            : "";

  const hasBorder = sessionType !== "general";

  if (isEditing) {
    return (
      <SidebarMenuItem>
        <div className="flex h-8 items-center gap-2 px-2">
          <TypeIcon className={`size-4 shrink-0 ${iconColorClass}`} />
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
        className={`h-auto py-1.5 ${hasBorder ? `border-l-2 ${borderColorClass}` : ""}`}
        onClick={() => {
          onSelect?.(session.id);
        }}
      >
        <TypeIcon className={`mt-0.5 self-start ${iconColorClass}`} />
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

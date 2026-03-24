import type { AgentSession } from "@capyfin/contracts";
import {
  BookOpenIcon,
  HomeIcon,
  ListChecksIcon,
  MessageSquareIcon,
  SearchIcon,
  SettingsIcon,
  ZapIcon,
  NewspaperIcon,
  ActivityIcon,
  CalculatorIcon,
  FileBarChart2Icon,
  ScaleIcon,
  TrendingUpIcon,
  BarChart3Icon,
  GitCompareArrowsIcon,
  PlayIcon,
} from "lucide-react";
import { useMemo, useCallback } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  getNavigationItems,
  getActionItems,
  getSessionItems,
} from "./palette-items";
import type { ActionCard } from "@/features/launchpad/types";
import {
  actionCards,
  portfolioCards,
} from "@/features/launchpad/card-registry";

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const NAV_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Home: HomeIcon,
  Chat: MessageSquareIcon,
  Watchlist: ListChecksIcon,
  Library: BookOpenIcon,
  Automation: ZapIcon,
  Settings: SettingsIcon,
};

const CARD_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Newspaper: NewspaperIcon,
  Activity: ActivityIcon,
  Search: SearchIcon,
  Calculator: CalculatorIcon,
  FileBarChart: FileBarChart2Icon,
  Scale: ScaleIcon,
  TrendingUp: TrendingUpIcon,
  BarChart3: BarChart3Icon,
  GitCompareArrows: GitCompareArrowsIcon,
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

interface CommandPaletteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: AgentSession[];
  onNavigate: (href: string) => void;
  onSelectSession: (sessionId: string) => void;
  onSelectCard: (card: ActionCard) => void;
}

export function CommandPaletteDialog({
  isOpen,
  onOpenChange,
  sessions,
  onNavigate,
  onSelectSession,
  onSelectCard,
}: CommandPaletteDialogProps) {
  const navigationItems = useMemo(() => getNavigationItems(), []);
  const actionItems = useMemo(() => getActionItems(), []);
  const sessionItems = useMemo(() => getSessionItems(sessions), [sessions]);

  const allCards = useMemo(() => [...actionCards, ...portfolioCards], []);

  const handleSelect = useCallback(
    (value: string) => {
      onOpenChange(false);

      if (value.startsWith("nav-")) {
        const item = navigationItems.find((i) => i.id === value);
        if (item?.href) {
          onNavigate(item.href);
        }
        return;
      }

      if (value.startsWith("action-")) {
        const cardId = value.replace("action-", "");
        const card = allCards.find((c) => c.id === cardId);
        if (card) {
          onSelectCard(card);
        }
        return;
      }

      if (value.startsWith("session-")) {
        const sessionId = value.replace("session-", "");
        onSelectSession(sessionId);
      }
    },
    [
      onOpenChange,
      onNavigate,
      onSelectSession,
      onSelectCard,
      navigationItems,
      allCards,
    ],
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <Command className="rounded-xl" shouldFilter>
        <CommandInput placeholder="Search commands, actions, sessions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            {navigationItems.map((item) => {
              const Icon = NAV_ICON_MAP[item.label];
              return (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  keywords={[item.label]}
                  onSelect={handleSelect}
                >
                  {Icon ? (
                    <Icon className="size-4 text-muted-foreground" />
                  ) : null}
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandGroup heading="Actions">
            {actionItems.map((item) => {
              const card = allCards.find((c) => c.id === item.cardId);
              const Icon = card ? CARD_ICON_MAP[card.icon] : undefined;
              return (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  keywords={[item.label, card?.promise ?? ""]}
                  onSelect={handleSelect}
                >
                  {Icon ? (
                    <Icon className="size-4 text-muted-foreground" />
                  ) : (
                    <PlayIcon className="size-4 text-muted-foreground" />
                  )}
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          {sessionItems.length > 0 ? (
            <CommandGroup heading="Recent Sessions">
              {sessionItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  keywords={[item.label]}
                  onSelect={handleSelect}
                >
                  <MessageSquareIcon className="size-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

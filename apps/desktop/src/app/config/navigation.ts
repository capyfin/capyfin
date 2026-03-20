import type { LucideIcon } from "lucide-react";
import {
  BotIcon,
  Link2Icon,
  MessageSquareIcon,
  Settings2Icon,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const primaryNavigation: NavigationItem[] = [
  {
    title: "Chat",
    href: "#chat",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: MessageSquareIcon,
  },
  {
    title: "Agents",
    href: "#agents",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: BotIcon,
  },
  {
    title: "Connections",
    href: "#connections",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: Link2Icon,
  },
];

export const secondaryNavigation: NavigationItem[] = [
  {
    title: "Settings",
    href: "#settings",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: Settings2Icon,
  },
];

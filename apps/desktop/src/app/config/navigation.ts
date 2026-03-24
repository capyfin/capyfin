import {
  BookOpenIcon,
  HomeIcon,
  ListChecksIcon,
  MessageSquareIcon,
  SettingsIcon,
  ZapIcon,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
export const primaryNavigation = [
  {
    title: "Home",
    href: "#launchpad",
    icon: HomeIcon,
  },
  {
    title: "Chat",
    href: "#chat",
    icon: MessageSquareIcon,
  },
  {
    title: "Watchlist",
    href: "#watchlist",
    icon: ListChecksIcon,
  },
  {
    title: "Library",
    href: "#library",
    icon: BookOpenIcon,
  },
  {
    title: "Automation",
    href: "#automation",
    icon: ZapIcon,
  },
  {
    title: "Settings",
    href: "#settings",
    icon: SettingsIcon,
  },
] as const;
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

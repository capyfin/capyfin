import {
  BotIcon,
  HomeIcon,
  MessageSquareIcon,
  SlidersHorizontalIcon,
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
    title: "Agents",
    href: "#agents",
    icon: BotIcon,
  },
  {
    title: "Providers",
    href: "#providers",
    icon: SlidersHorizontalIcon,
  },
] as const;
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

import { BotIcon, HomeIcon, Link2Icon, MessageSquareIcon } from "lucide-react";

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
    title: "Connections",
    href: "#connections",
    icon: Link2Icon,
  },
] as const;
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

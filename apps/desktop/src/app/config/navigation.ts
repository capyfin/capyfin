import {
  BookOpenIcon,
  HomeIcon,
  ListChecksIcon,
  MessageSquareIcon,
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
] as const;
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

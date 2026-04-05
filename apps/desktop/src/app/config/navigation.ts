import {
  BookOpenIcon,
  BriefcaseIcon,
  HomeIcon,
  ListChecksIcon,
  MessageSquareIcon,
  PieChartIcon,
  ZapIcon,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
export const primaryNavigation = [
  {
    title: "Home",
    href: "#home",
    icon: HomeIcon,
  },
  {
    title: "Cases",
    href: "#cases",
    icon: BriefcaseIcon,
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
    title: "Portfolio",
    href: "#portfolio",
    icon: PieChartIcon,
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

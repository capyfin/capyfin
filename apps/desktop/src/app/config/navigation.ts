import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRightIcon,
  BadgeDollarSignIcon,
  BellDotIcon,
  BookOpenTextIcon,
  CircleHelpIcon,
  Link2Icon,
  LandmarkIcon,
  LayoutDashboardIcon,
  PiggyBankIcon,
  Settings2Icon,
  WalletCardsIcon,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const primaryNavigation: NavigationItem[] = [
  {
    title: "Overview",
    href: "#overview",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Portfolio",
    href: "#portfolio",
    icon: WalletCardsIcon,
    badge: "Core",
  },
  {
    title: "Connections",
    href: "#connections",
    icon: Link2Icon,
    badge: "Setup",
  },
  {
    title: "Cash Flow",
    href: "#cash-flow",
    icon: ArrowLeftRightIcon,
  },
  {
    title: "Budgets",
    href: "#budgets",
    icon: PiggyBankIcon,
  },
];

export const workspaceNavigation: NavigationItem[] = [
  {
    title: "Accounts",
    href: "#accounts",
    icon: LandmarkIcon,
  },
  {
    title: "Statements",
    href: "#statements",
    icon: BookOpenTextIcon,
  },
  {
    title: "Tax Lots",
    href: "#tax-lots",
    icon: BadgeDollarSignIcon,
  },
];

export const secondaryNavigation: NavigationItem[] = [
  {
    title: "Notifications",
    href: "#notifications",
    icon: BellDotIcon,
  },
  {
    title: "Settings",
    href: "#settings",
    icon: Settings2Icon,
  },
  {
    title: "Help",
    href: "#help",
    icon: CircleHelpIcon,
  },
];

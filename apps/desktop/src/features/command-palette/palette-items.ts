import type { AgentSession } from "@capyfin/contracts";
import { primaryNavigation } from "@/app/config/navigation";
import {
  actionCards,
  portfolioCards,
} from "@/features/launchpad/card-registry";

export interface PaletteItem {
  id: string;
  label: string;
  category: "Navigation" | "Actions" | "Recent Sessions";
  icon?: string;
  /** Hash route for navigation items */
  href?: string;
  /** Card ID for action items */
  cardId?: string;
  /** Session ID for session items */
  sessionId?: string;
}

export function getNavigationItems(): PaletteItem[] {
  return primaryNavigation.map((nav) => ({
    id: `nav-${nav.href.replace("#", "")}`,
    label: nav.title,
    category: "Navigation" as const,
    href: nav.href,
  }));
}

export function getActionItems(): PaletteItem[] {
  return [...actionCards, ...portfolioCards].map((card) => ({
    id: `action-${card.id}`,
    label: card.title,
    category: "Actions" as const,
    cardId: card.id,
  }));
}

export function getSessionItems(sessions: AgentSession[]): PaletteItem[] {
  return sessions.map((session) => ({
    id: `session-${session.id}`,
    label: session.label ?? `Chat ${session.id}`,
    category: "Recent Sessions" as const,
    sessionId: session.id,
  }));
}

import type { LucideIcon } from "lucide-react";
import {
  DollarSignIcon,
  MessageSquareIcon,
  MicroscopeIcon,
  RefreshCwIcon,
  SunriseIcon,
} from "lucide-react";

export type SessionType =
  | "deep-dive"
  | "morning-brief"
  | "position-review"
  | "fair-value"
  | "general";

interface SessionTypeMeta {
  icon: LucideIcon;
  /** Tailwind color token for the accent (e.g. "blue", "amber"). Undefined for general. */
  color?: string | undefined;
}

const TYPE_PATTERNS: [RegExp, SessionType][] = [
  [/^deep\s*dive/i, "deep-dive"],
  [/^morning\s*brief/i, "morning-brief"],
  [/^position\s*review/i, "position-review"],
  [/^fair\s*value/i, "fair-value"],
];

/**
 * Detect the session type from a session label string.
 * Returns "general" for unrecognized or empty labels.
 */
export function detectSessionType(label: string): SessionType {
  for (const [pattern, type] of TYPE_PATTERNS) {
    if (pattern.test(label)) return type;
  }
  return "general";
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
export const SESSION_TYPE_META: Record<SessionType, SessionTypeMeta> = {
  "deep-dive": { icon: MicroscopeIcon, color: "blue" },
  "morning-brief": { icon: SunriseIcon, color: "amber" },
  "position-review": { icon: RefreshCwIcon, color: "green" },
  "fair-value": { icon: DollarSignIcon, color: "emerald" },
  general: { icon: MessageSquareIcon },
};

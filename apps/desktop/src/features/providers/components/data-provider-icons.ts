import { BarChart3, Landmark, type LucideIcon } from "lucide-react";

export interface DataProviderIconEntry {
  icon: LucideIcon;
  bg: string;
  text: string;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
export const dataProviderIconConfig: Record<string, DataProviderIconEntry> = {
  fmp: {
    icon: BarChart3,
    bg: "bg-blue-500/8",
    text: "text-blue-500",
  },
  fred: {
    icon: Landmark,
    bg: "bg-violet-500/8",
    text: "text-violet-500",
  },
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

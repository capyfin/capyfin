import {
  Activity,
  Calculator,
  PieChart,
  Search,
  ShieldAlert,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface StarterPrompt {
  text: string;
  icon: LucideIcon;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
export const MARKET_STARTER_PROMPTS: StarterPrompt[] = [
  { text: "Give me a market overview for today.", icon: Activity },
  { text: "Screen for high-dividend stocks with low P/E ratios.", icon: Search },
  { text: "What should I prepare before harvesting tax losses?", icon: Calculator },
];

export const PORTFOLIO_STARTER_PROMPTS: StarterPrompt[] = [
  { text: "Review my current portfolio risk and call out the biggest concerns.", icon: ShieldAlert },
  { text: "Analyze my portfolio allocation and flag any concentration risks.", icon: PieChart },
  { text: "How is my portfolio performing? Show me the winners and losers.", icon: TrendingUp },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

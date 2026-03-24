export type ActionCategory =
  | "today"
  | "research"
  | "setups"
  | "income"
  | "portfolio";

export type CardInputMode =
  | "none"
  | "ticker"
  | "tickers"
  | "preferences"
  | "upload";

export type EstimatedDuration = "fast" | "medium" | "deep";

export interface ActionCard {
  id: string;
  title: string;
  promise: string;
  icon: string;
  category: ActionCategory;
  input: CardInputMode;
  estimatedDuration: EstimatedDuration;
  skills: string[];
  persona?: string;
  prompt: string;
  schedulable?: boolean;
  /** Override input and prompt when FMP is not connected (Tier 0). */
  tier0Override?: {
    input: CardInputMode;
    prompt: string;
  };
}

export interface CardSection {
  id: ActionCategory;
  title: string;
  cards: ActionCard[];
}

export type ActionCategory = "today" | "research" | "setups" | "portfolio";

export interface ActionCard {
  id: string;
  title: string;
  promise: string;
  icon: string;
  category: ActionCategory;
  input: "none" | "ticker" | "tickers" | "preferences" | "upload";
  skills: string[];
  persona?: string;
  prompt: string;
  schedulable?: boolean;
}

export interface CardSection {
  id: ActionCategory;
  title: string;
  cards: ActionCard[];
}

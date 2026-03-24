export interface TickerMatch {
  ticker: string;
  startIndex: number;
  endIndex: number;
}

const TICKER_PATTERN = /\$([A-Z]{1,5})\b/g;

export function detectTickers(text: string): TickerMatch[] {
  const matches: TickerMatch[] = [];
  let match: RegExpExecArray | null;
  while ((match = TICKER_PATTERN.exec(text)) !== null) {
    const ticker = match[1];
    if (ticker) {
      matches.push({
        ticker,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }
  return matches;
}

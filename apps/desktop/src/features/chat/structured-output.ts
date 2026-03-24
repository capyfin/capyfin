import { cardOutputSchema, type CardOutput } from "@capyfin/contracts";

export interface ParsedCardOutput {
  cardOutput: CardOutput;
  prefixText: string;
  suffixText: string;
}

const JSON_BLOCK_RE = /```json\n([\s\S]*?)\n```/g;

export function tryParseCardOutput(text: string): ParsedCardOutput | null {
  if (!text) {
    return null;
  }

  let match: RegExpExecArray | null;
  while ((match = JSON_BLOCK_RE.exec(text)) !== null) {
    const raw = match[1];
    if (!raw) {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    const result = cardOutputSchema.safeParse(parsed);
    if (!result.success) {
      continue;
    }

    const blockStart = match.index;
    const blockEnd = match.index + match[0].length;
    const prefixText = text.slice(0, blockStart).trim();
    const suffixText = text.slice(blockEnd).trim();

    JSON_BLOCK_RE.lastIndex = 0;
    return { cardOutput: result.data, prefixText, suffixText };
  }

  JSON_BLOCK_RE.lastIndex = 0;
  return null;
}

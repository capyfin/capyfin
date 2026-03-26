export interface ParsedHoldingRow {
  ticker: string;
  name?: string;
  shares: number;
  costBasis: number;
  sector?: string;
}

export interface CsvParseResult {
  rows: ParsedHoldingRow[];
  warnings: string[];
}

const TICKER_ALIASES = new Set(["ticker", "symbol"]);
const SHARES_ALIASES = new Set(["shares", "quantity", "units"]);
const COST_ALIASES = new Set([
  "cost basis",
  "costbasis",
  "price",
  "avg cost",
  "average price",
  "avgcost",
]);
const NAME_ALIASES = new Set(["name", "company", "description"]);
const SECTOR_ALIASES = new Set(["sector", "industry"]);

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line.charAt(i);
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line.charAt(i + 1) === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function matchColumn(
  header: string | undefined,
  aliases: Set<string>,
): boolean {
  if (!header) return false;
  const normalized = header.toLowerCase().trim();
  return aliases.has(normalized);
}

function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[,$]/g, "").trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function parseCsv(csv: string): CsvParseResult {
  const warnings: string[] = [];
  const lines = csv
    .trim()
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    warnings.push("CSV is empty.");
    return { rows: [], warnings };
  }

  const headerLine = lines[0];
  if (!headerLine) {
    warnings.push("CSV is empty.");
    return { rows: [], warnings };
  }

  const headers = parseCsvLine(headerLine).map((h) =>
    h.replace(/^"|"$/g, "").trim(),
  );

  let tickerIndex = -1;
  let sharesIndex = -1;
  let costIndex = -1;
  let nameIndex = -1;
  let sectorIndex = -1;

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (tickerIndex === -1 && matchColumn(h, TICKER_ALIASES)) tickerIndex = i;
    else if (sharesIndex === -1 && matchColumn(h, SHARES_ALIASES))
      sharesIndex = i;
    else if (costIndex === -1 && matchColumn(h, COST_ALIASES)) costIndex = i;
    else if (nameIndex === -1 && matchColumn(h, NAME_ALIASES)) nameIndex = i;
    else if (sectorIndex === -1 && matchColumn(h, SECTOR_ALIASES))
      sectorIndex = i;
  }

  if (tickerIndex === -1) {
    warnings.push(
      "Could not find a ticker/symbol column. Expected one of: ticker, symbol.",
    );
    return { rows: [], warnings };
  }
  if (sharesIndex === -1) {
    warnings.push(
      "Could not find a shares/quantity column. Expected one of: shares, quantity, units.",
    );
    return { rows: [], warnings };
  }
  if (costIndex === -1) {
    warnings.push(
      "Could not find a cost basis/price column. Expected one of: cost basis, price, avg cost, average price.",
    );
    return { rows: [], warnings };
  }

  const rows: ParsedHoldingRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const fields = parseCsvLine(line).map((f) =>
      f.replace(/^"|"$/g, "").trim(),
    );

    const ticker = fields[tickerIndex]?.trim();
    if (!ticker) {
      warnings.push(`Row ${String(i)}: missing ticker, skipping.`);
      continue;
    }

    const shares = parseNumber(fields[sharesIndex] ?? "");
    if (shares === null || shares <= 0) {
      warnings.push(`Row ${String(i)}: invalid shares value, skipping.`);
      continue;
    }

    const costBasis = parseNumber(fields[costIndex] ?? "");
    if (costBasis === null) {
      warnings.push(`Row ${String(i)}: invalid cost basis value, skipping.`);
      continue;
    }

    const row: ParsedHoldingRow = { ticker, shares, costBasis };

    if (nameIndex !== -1) {
      const name = fields[nameIndex]?.trim();
      if (name) row.name = name;
    }

    if (sectorIndex !== -1) {
      const sector = fields[sectorIndex]?.trim();
      if (sector) row.sector = sector;
    }

    rows.push(row);
  }

  return { rows, warnings };
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { WatchlistItem } from "@capyfin/contracts";

/**
 * Sync watchlist items to the agent workspace as a CSV file and
 * ensure USER.md references the watchlist file.
 */
export async function syncWatchlistToWorkspace(
  workspaceDir: string,
  items: WatchlistItem[],
): Promise<void> {
  await mkdir(workspaceDir, { recursive: true });

  // Write watchlist.csv
  const header = "ticker,list,note,thesis,targetZone,addedAt,tags";
  const rows = items.map(
    (item) =>
      `${item.ticker},${item.list},${escapeCsv(item.note)},${escapeCsv(item.thesis)},${escapeCsv(item.targetZone)},${item.addedAt},${escapeCsv(item.tags?.join(";"))}`,
  );
  const csv = [header, ...rows].join("\n") + "\n";
  await writeFile(join(workspaceDir, "watchlist.csv"), csv, "utf-8");

  // Update USER.md to reference the watchlist file (idempotent)
  const userPath = join(workspaceDir, "USER.md");
  let userContent: string;
  try {
    userContent = await readFile(userPath, "utf-8");
  } catch {
    userContent = "";
  }

  if (!userContent.includes("watchlist.csv")) {
    const watchlistSection = [
      "",
      "## Watchlist",
      "",
      "Your watchlist is stored in `watchlist.csv` in this workspace.",
      "Read this file when the user asks about their watchlist, tracked tickers, or positions they are watching.",
      "",
    ].join("\n");

    await writeFile(
      userPath,
      userContent.trimEnd() + "\n" + watchlistSection,
      "utf-8",
    );
  }
}

function escapeCsv(value: string | undefined): string {
  if (!value) {
    return "";
  }
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

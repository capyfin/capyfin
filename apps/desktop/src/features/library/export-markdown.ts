import type { CardOutput } from "@capyfin/contracts";

export function cardOutputToMarkdown(cardOutput: CardOutput): string {
  const lines: string[] = [];

  lines.push(`# ${cardOutput.title}`);
  if (cardOutput.subject) {
    lines.push(`**${cardOutput.subject}**`);
  }
  lines.push("");

  lines.push(cardOutput.summary);
  lines.push("");

  if (cardOutput.scores && Object.keys(cardOutput.scores).length > 0) {
    lines.push("## Scores");
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("| --- | --- |");
    for (const [key, value] of Object.entries(cardOutput.scores)) {
      lines.push(`| ${key} | ${String(value)} |`);
    }
    lines.push("");
  }

  for (const section of cardOutput.sections) {
    lines.push(`## ${section.title}`);
    lines.push(`*Confidence: ${section.confidence}*`);
    lines.push("");
    lines.push(section.content);
    lines.push("");

    if (section.citations.length > 0) {
      lines.push("**Sources:**");
      for (const citation of section.citations) {
        lines.push(
          `- ${citation.label} — ${citation.source} (${citation.date})`,
        );
      }
      lines.push("");
    }
  }

  if (cardOutput.keyRisks.length > 0) {
    lines.push("## Key Risks");
    lines.push("");
    for (const risk of cardOutput.keyRisks) {
      lines.push(`- ${risk}`);
    }
    lines.push("");
  }

  if (cardOutput.challengeSummary) {
    lines.push("## Challenge");
    lines.push("");
    lines.push(cardOutput.challengeSummary);
    lines.push("");
  }

  if (cardOutput.improvementNote) {
    lines.push("## Improvement Note");
    lines.push("");
    lines.push(cardOutput.improvementNote);
    lines.push("");
  }

  lines.push("---");
  lines.push(
    `Data tier: ${cardOutput.dataTier} | Sources: ${String(cardOutput.sourcesUsed.length)} | As of: ${cardOutput.dataAsOf}`,
  );

  return lines.join("\n");
}

export async function copyReportToClipboard(
  cardOutput: CardOutput,
): Promise<void> {
  const markdown = cardOutputToMarkdown(cardOutput);
  await navigator.clipboard.writeText(markdown);
}

export function downloadReportAsMarkdown(
  cardOutput: CardOutput,
  filename?: string,
): void {
  const markdown = cardOutputToMarkdown(cardOutput);
  const name =
    filename ??
    `${cardOutput.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

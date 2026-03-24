interface ScoresTableProps {
  scores: Record<string, number | string>;
}

export function ScoresTable({ scores }: ScoresTableProps) {
  const entries = Object.entries(scores);
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="border-b border-border/40 last:border-b-0">
              <td className="bg-muted/30 px-3.5 py-2 font-medium text-muted-foreground">
                {key}
              </td>
              <td className="px-3.5 py-2 text-foreground">
                {typeof value === "number" ? value.toLocaleString() : value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

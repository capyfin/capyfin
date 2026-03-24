import { LightbulbIcon } from "lucide-react";

interface ImprovementNoteProps {
  note: string;
}

export function ImprovementNote({ note }: ImprovementNoteProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3.5 py-2.5 text-sm text-blue-700 dark:text-blue-300">
      <LightbulbIcon className="mt-0.5 size-4 shrink-0" />
      <p className="leading-relaxed">{note}</p>
    </div>
  );
}

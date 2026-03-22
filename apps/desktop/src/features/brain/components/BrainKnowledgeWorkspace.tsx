import { BookOpenIcon, StickyNoteIcon } from "lucide-react";

export const REFERENCES_EMPTY_TEXT =
  "No references yet. Files and documentation shared in chat will appear here.";
export const NOTES_EMPTY_TEXT =
  "No notes yet. Observations and insights from your research will appear here.";

interface BrainKnowledgeWorkspaceProps {
  references?: unknown[];
  notes?: unknown[];
}

export function BrainKnowledgeWorkspace({
  references = [],
  notes = [],
}: BrainKnowledgeWorkspaceProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4">
      <section className="rounded-lg border border-blue-400/20 bg-blue-500/5">
        <div className="flex items-center gap-2.5 px-4 py-3 lg:px-5">
          <BookOpenIcon className="size-4 text-blue-400" />
          <h2 className="text-[14px] font-semibold text-foreground">
            References
          </h2>
        </div>

        <div className="border-t border-blue-400/20 px-4 py-5 lg:px-5">
          {references.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              {REFERENCES_EMPTY_TEXT}
            </p>
          ) : (
            <ul className="space-y-2">
              {references.map((ref, index) => (
                <li key={index} className="text-[13px] text-foreground">
                  {String(ref)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-amber-400/20 bg-amber-500/5">
        <div className="flex items-center gap-2.5 px-4 py-3 lg:px-5">
          <StickyNoteIcon className="size-4 text-amber-400" />
          <h2 className="text-[14px] font-semibold text-foreground">Notes</h2>
        </div>

        <div className="border-t border-amber-400/20 px-4 py-5 lg:px-5">
          {notes.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              {NOTES_EMPTY_TEXT}
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.map((note, index) => (
                <li key={index} className="text-[13px] text-foreground">
                  {String(note)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

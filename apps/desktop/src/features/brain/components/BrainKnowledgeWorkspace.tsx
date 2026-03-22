import { BookOpenIcon, StickyNoteIcon } from "lucide-react";

export const REFERENCES_EMPTY_TEXT =
  "No references added yet. Import files or paste documentation to add context.";
export const NOTES_EMPTY_TEXT =
  "No notes yet. Add observations or domain knowledge here.";

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
      <section className="rounded-lg border border-border/60 bg-card">
        <div className="flex items-center gap-2.5 px-4 py-3 lg:px-5">
          <BookOpenIcon className="size-4 text-muted-foreground/60" />
          <h2 className="text-[14px] font-semibold text-foreground">
            References
          </h2>
        </div>

        <div className="border-t border-border/60 px-4 py-5 lg:px-5">
          {references.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              {REFERENCES_EMPTY_TEXT}
            </p>
          ) : (
            <ul className="space-y-2">
              {references.map((ref, index) => (
                <li
                  key={index}
                  className="text-[13px] text-foreground"
                >
                  {String(ref)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border/60 bg-card">
        <div className="flex items-center gap-2.5 px-4 py-3 lg:px-5">
          <StickyNoteIcon className="size-4 text-muted-foreground/60" />
          <h2 className="text-[14px] font-semibold text-foreground">Notes</h2>
        </div>

        <div className="border-t border-border/60 px-4 py-5 lg:px-5">
          {notes.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              {NOTES_EMPTY_TEXT}
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.map((note, index) => (
                <li
                  key={index}
                  className="text-[13px] text-foreground"
                >
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

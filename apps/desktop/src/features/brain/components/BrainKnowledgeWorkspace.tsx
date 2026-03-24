import {
  BookOpenIcon,
  MessageSquareIcon,
  RocketIcon,
  StickyNoteIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const REFERENCES_EMPTY_TEXT =
  "Files and documentation shared in chat will appear here.";
export const NOTES_EMPTY_TEXT =
  "Observations and insights from your research will appear here.";

interface BrainKnowledgeWorkspaceProps {
  references?: unknown[];
  notes?: unknown[];
}

export function BrainKnowledgeWorkspace({
  references = [],
  notes = [],
}: BrainKnowledgeWorkspaceProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Your research memory — references, notes, and context that inform your
        assistant.
      </p>

      <section className="rounded-lg border border-blue-400/20 bg-blue-500/5">
        <div className="flex items-center gap-2.5 px-4 py-3 lg:px-5">
          <BookOpenIcon className="size-4 text-blue-400" />
          <h2 className="text-[14px] font-semibold text-foreground">
            References
          </h2>
        </div>

        <div className="border-t border-blue-400/20 px-4 py-8 lg:px-5">
          {references.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 py-6">
              <div className="relative">
                <div className="absolute -inset-3 rounded-2xl bg-blue-500/[0.06] blur-xl dark:bg-blue-500/[0.08]" />
                <div className="relative flex size-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] dark:bg-blue-500/[0.1]">
                  <BookOpenIcon className="size-6 text-blue-500" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-[17px] font-semibold text-foreground">
                  No references yet
                </h3>
                <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                  {REFERENCES_EMPTY_TEXT}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.hash = "#chat";
                }}
              >
                <MessageSquareIcon className="size-3.5" />
                Go to Chat
              </Button>
            </div>
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

        <div className="border-t border-amber-400/20 px-4 py-8 lg:px-5">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 py-6">
              <div className="relative">
                <div className="absolute -inset-3 rounded-2xl bg-amber-500/[0.06] blur-xl dark:bg-amber-500/[0.08]" />
                <div className="relative flex size-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] dark:bg-amber-500/[0.1]">
                  <StickyNoteIcon className="size-6 text-amber-500" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-[17px] font-semibold text-foreground">
                  No notes yet
                </h3>
                <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                  {NOTES_EMPTY_TEXT}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.hash = "#launchpad";
                }}
              >
                <RocketIcon className="size-3.5" />
                Start Research
              </Button>
            </div>
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

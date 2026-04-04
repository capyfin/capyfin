import {
  BookOpenIcon,
  BrainIcon,
  MessageSquareIcon,
  RocketIcon,
  StickyNoteIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";

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
      {/* Page header with icon accent */}
      <div className="flex items-start gap-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/[0.08] ring-1 ring-violet-500/10">
          <BrainIcon className="size-5 text-violet-500" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Brain
          </h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
            Your research memory — references, notes, and context that inform
            your assistant.
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-blue-400/20 bg-gradient-to-b from-blue-500/[0.04] to-card/50">
        <div className="flex items-center gap-2.5 border-b border-blue-400/15 px-4 py-3.5 lg:px-5">
          <BookOpenIcon className="size-4 text-blue-400" />
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-blue-400">
            References
          </h3>
        </div>

        <div className="px-4 py-8 lg:px-5">
          {references.length === 0 ? (
            <EmptyState
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
              icon={BookOpenIcon}
              iconColor="blue"
              heading="No references yet"
              description={REFERENCES_EMPTY_TEXT}
              className="flex flex-col items-center justify-center gap-5 py-6"
            >
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
            </EmptyState>
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

      <section className="overflow-hidden rounded-xl border border-amber-400/20 bg-gradient-to-b from-amber-500/[0.04] to-card/50">
        <div className="flex items-center gap-2.5 border-b border-amber-400/15 px-4 py-3.5 lg:px-5">
          <StickyNoteIcon className="size-4 text-amber-400" />
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-amber-400">
            Notes
          </h3>
        </div>

        <div className="px-4 py-8 lg:px-5">
          {notes.length === 0 ? (
            <EmptyState
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
              icon={StickyNoteIcon}
              iconColor="amber"
              heading="No notes yet"
              description={NOTES_EMPTY_TEXT}
              className="flex flex-col items-center justify-center gap-5 py-6"
            >
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
            </EmptyState>
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

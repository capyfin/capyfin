import { BookOpenIcon } from "lucide-react";

export const LIBRARY_EMPTY_TEXT =
  "No saved reports yet. Research outputs and saved analyses will appear here.";

export function LibraryWorkspace() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-3 py-16">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <BookOpenIcon className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-[15px] font-semibold text-foreground">Library</h2>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        {LIBRARY_EMPTY_TEXT}
      </p>
    </div>
  );
}

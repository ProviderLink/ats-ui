import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckIcon, PencilIcon, XIcon } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

/** One `text-sm leading-relaxed` line — the editor's minimum height. */
const NOTES_EDIT_MIN_HEIGHT = 23;
/** Past this the editor scrolls instead of growing without limit. */
const NOTES_EDIT_MAX_HEIGHT = 160;

export function TalentPoolNotesEditor({
  notes,
  mutating,
  onSave,
}: {
  notes: string;
  mutating: boolean;
  onSave: (notes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // The editor is an inline, borderless textarea inside the same card as the
  // read view, so opening it never changes the card's height for a short note.
  // It grows with the content up to a cap, then scrolls.
  useLayoutEffect(() => {
    if (!editing) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(
      Math.min(el.scrollHeight, NOTES_EDIT_MAX_HEIGHT),
      NOTES_EDIT_MIN_HEIGHT
    )}px`;
  }, [editing, draft]);

  if (editing) {
    return (
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <Textarea
          ref={textareaRef}
          rows={1}
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="min-w-0 flex-1 resize-none border-0 bg-transparent px-0 py-0 text-sm leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
          placeholder="Add a note about this candidate…"
          disabled={mutating}
        />
        {/*
          The same 68px slot the pencil occupies in read mode, so the text
          column keeps its exact width and entering edit mode never reflows
          the note onto an extra line.
        */}
        <div className="flex w-17 shrink-0 items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            disabled={mutating}
            title="Cancel"
            onClick={() => {
              setEditing(false);
              setDraft(notes);
            }}
          >
            <XIcon className="size-3.5" />
            <span className="sr-only">Cancel editing notes</span>
          </Button>
          <Button
            size="icon-sm"
            disabled={mutating}
            title="Save"
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
          >
            <CheckIcon className="size-3.5" />
            <span className="sr-only">Save notes</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
      {notes.trim() ? (
        <p className="min-w-0 flex-1 text-sm leading-relaxed whitespace-pre-wrap">
          {notes}
        </p>
      ) : (
        <p className="min-w-0 flex-1 text-sm text-muted-foreground italic">
          No notes yet — add context about this candidate for your team.
        </p>
      )}
      <div className="flex w-17 shrink-0 items-center justify-end gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={mutating}
          title="Edit notes"
          onClick={() => {
            setDraft(notes);
            setEditing(true);
          }}
        >
          <PencilIcon className="size-3.5" />
          <span className="sr-only">Edit talent pool notes</span>
        </Button>
      </div>
    </div>
  );
}

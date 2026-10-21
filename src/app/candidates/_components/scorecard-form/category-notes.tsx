import { Textarea } from '@/components/ui/textarea';
import { StickyNoteIcon } from 'lucide-react';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';

type CategoryNotesName =
  | 'commNotes'
  | 'experienceNotes'
  | 'professionalismNotes'
  | 'technologyNotes'
  | 'availabilityNotes';

interface CategoryNotesProps {
  name: CategoryNotesName;
}

/** Collapsed to a single link until used; opens on its own when a note exists. */
export function CategoryNotes({ name }: CategoryNotesProps) {
  const { register, control, setValue } = useFormContext<ScorecardFormValues>();
  const value = useWatch({ control, name });
  const [opened, setOpened] = useState(false);
  const field = register(name);

  if (!opened && !value?.trim()) {
    return (
      <button
        type="button"
        onClick={() => setOpened(true)}
        className="flex w-fit items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <StickyNoteIcon className="size-3.5" />
        Add a note
      </button>
    );
  }

  return (
    <Textarea
      autoFocus={opened}
      aria-label="Notes"
      placeholder="Notes for this section…"
      className="min-h-16 resize-none text-sm"
      rows={2}
      maxLength={2000}
      {...field}
      onBlur={e => {
        void field.onBlur(e);
        // Left empty: fold back to the "Add a note" link.
        if (!e.target.value.trim()) {
          setValue(name, '');
          setOpened(false);
        }
      }}
    />
  );
}

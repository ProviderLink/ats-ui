import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { Application } from '@/store/types';
import { SectionLabel } from './section-label';

interface PipelineNotesSectionProps {
  activeApp: Application | null;
  notesText: string;
  onNotesTextChange: (text: string) => void;
  onFocus: () => void;
  saving: boolean;
  onSave: () => void;
}

export function PipelineNotesSection({
  activeApp,
  notesText,
  onNotesTextChange,
  onFocus,
  saving,
  onSave,
}: PipelineNotesSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <SectionLabel>Notes</SectionLabel>
      <div className="flex flex-col gap-2">
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Add pipeline notes..."
          value={notesText}
          onChange={e => onNotesTextChange(e.target.value)}
          onFocus={onFocus}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={saving || !activeApp}
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save Notes'}
          </Button>
        </div>
        {activeApp?.notes && (
          <p className="text-xs text-muted-foreground">
            Last saved: {formatDate(activeApp.updatedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

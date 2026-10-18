import { Textarea } from '@/components/ui/textarea';
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
        <Textarea
          className="min-h-20"
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

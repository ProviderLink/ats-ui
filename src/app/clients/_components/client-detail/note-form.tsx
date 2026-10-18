import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { NoteMethod } from '@/store/types';
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { noteMethodConfig } from './config';

export function NoteForm({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial?: { method: NoteMethod; content: string };
  saving?: boolean;
  onSave: (data: { method: NoteMethod; content: string }) => void;
  onCancel: () => void;
}) {
  const [method, setMethod] = useState<NoteMethod>(initial?.method ?? 'call');
  const [content, setContent] = useState(initial?.content ?? '');
  const valid = content.trim().length > 0;

  return (
    <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Method</Label>
        <Select value={method} onValueChange={v => setMethod(v as NoteMethod)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(noteMethodConfig) as NoteMethod[]).map(m => (
              <SelectItem key={m} value={m}>
                {noteMethodConfig[m].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Note *</Label>
        <Textarea
          rows={3}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Brief note about the interaction..."
        />
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!valid || saving}
          onClick={() => onSave({ method, content: content.trim() })}
        >
          {saving ? <Loader2Icon className="size-4 animate-spin" /> : 'Save'}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

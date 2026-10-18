import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { emptyDraft, type ContactDraft } from './contact-draft';

export function ContactForm({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial?: ContactDraft;
  saving?: boolean;
  onSave: (d: ContactDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ContactDraft>(initial ?? emptyDraft());
  const set = (k: keyof ContactDraft, v: string | boolean) =>
    setDraft(p => ({ ...p, [k]: v }));
  const valid = draft.name.trim() && draft.email.trim();

  return (
    <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Name *</Label>
          <Input
            value={draft.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Position</Label>
          <Input
            value={draft.position}
            onChange={e => set('position', e.target.value)}
            placeholder="e.g. HR Director"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Email *</Label>
          <Input
            type="email"
            value={draft.email}
            onChange={e => set('email', e.target.value)}
            placeholder="email@company.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Phone</Label>
          <Input
            value={draft.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="isPrimary"
          checked={draft.isPrimary}
          onCheckedChange={v => set('isPrimary', Boolean(v))}
        />
        <Label htmlFor="isPrimary" className="cursor-pointer">
          Set as primary contact
        </Label>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!valid || saving}
          onClick={() => onSave(draft)}
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

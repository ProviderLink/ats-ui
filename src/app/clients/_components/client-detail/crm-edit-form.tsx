import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { ClientCrmProfile, CrmHealth } from '@/store/types';
import { Loader2Icon } from 'lucide-react';
import { SectionTitle } from './primitives';

export function CrmEditForm({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  draft: ClientCrmProfile;
  onChange: (d: ClientCrmProfile) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  function set<K extends keyof ClientCrmProfile>(k: K, v: ClientCrmProfile[K]) {
    onChange({ ...draft, [k]: v });
  }

  return (
    <div className="flex flex-col gap-5 py-5">
      <div className="flex flex-col gap-2">
        <Label>Health Status</Label>
        <Select
          value={draft.healthStatus ?? ''}
          onValueChange={v => set('healthStatus', v as CrmHealth)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="green">Healthy</SelectItem>
            <SelectItem value="yellow">At Risk</SelectItem>
            <SelectItem value="red">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Satisfaction Score (1–5)</Label>
          <Input
            type="number"
            min={1}
            max={5}
            value={draft.satisfactionScore ?? ''}
            onChange={e =>
              set(
                'satisfactionScore',
                e.target.value ? Number(e.target.value) : null
              )
            }
            placeholder="e.g. 4"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Open Issues</Label>
          <Input
            type="number"
            min={0}
            value={draft.openIssuesCount ?? 0}
            onChange={e => set('openIssuesCount', Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Last Check-in</Label>
        <Input
          type="date"
          value={
            draft.lastClientCheckin ? draft.lastClientCheckin.split('T')[0] : ''
          }
          onChange={e =>
            set(
              'lastClientCheckin',
              e.target.value ? new Date(e.target.value).toISOString() : null
            )
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>EMR System</Label>
        <Input
          value={draft.emrSystem ?? ''}
          onChange={e => set('emrSystem', e.target.value)}
          placeholder="e.g. Epic"
        />
      </div>

      <Separator />
      <SectionTitle>Onboarding</SectionTitle>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="editOnboarding"
            checked={!!draft.onboardingComplete}
            onCheckedChange={v => set('onboardingComplete', Boolean(v))}
          />
          <Label htmlFor="editOnboarding" className="cursor-pointer">
            Onboarding Complete
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="editSop"
            checked={!!draft.sopReceived}
            onCheckedChange={v => set('sopReceived', Boolean(v))}
          />
          <Label htmlFor="editSop" className="cursor-pointer">
            SOP Received
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="editBaa"
            checked={!!draft.baaSign}
            onCheckedChange={v => set('baaSign', Boolean(v))}
          />
          <Label htmlFor="editBaa" className="cursor-pointer">
            BAA Signed
          </Label>
        </div>
        {draft.baaSign && (
          <div className="flex flex-col gap-2">
            <Label>BAA Signed Date</Label>
            <Input
              type="date"
              value={
                draft.baaSignedDate ? draft.baaSignedDate.split('T')[0] : ''
              }
              onChange={e =>
                set(
                  'baaSignedDate',
                  e.target.value ? new Date(e.target.value).toISOString() : null
                )
              }
            />
          </div>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label>Notes</Label>
        <Textarea
          rows={4}
          value={draft.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Internal notes about this client..."
        />
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            'Save Changes'
          )}
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

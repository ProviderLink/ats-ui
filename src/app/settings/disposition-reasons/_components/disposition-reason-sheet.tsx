import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { patchJson, postJson } from '@/lib/api-client';
import {
  CATEGORY_LABELS,
  type DispositionReason,
  type DispositionReasonCategory,
} from '@/store/slices/disposition-reasons.store';
import { useState } from 'react';
import { toast } from 'sonner';
import { ReasonAdvancedOptions } from './reason-advanced-options';

interface DispositionReasonSheetProps {
  open: boolean;
  reason?: DispositionReason | null;
  sheetKey: number;
  onClose: () => void;
  onSaved: () => void;
}

export function DispositionReasonSheet({
  open,
  reason,
  sheetKey,
  onClose,
  onSaved,
}: DispositionReasonSheetProps) {
  const isEdit = !!reason;
  const [label, setLabel] = useState(reason?.label ?? '');
  const [category, setCategory] = useState<DispositionReasonCategory>(
    reason?.category ?? 'experience_and_qualifications'
  );
  const [isActive, setIsActive] = useState(reason?.isActive ?? true);
  const [applicableStages, setApplicableStages] = useState(
    reason?.applicableStages?.join(', ') ?? ''
  );
  const [requireInternalNotes, setRequireInternalNotes] = useState(
    reason?.requireInternalNotes ?? false
  );
  // Open up-front only when the reason uses advanced options, so the common
  // case stays a two-field form.
  const [advancedOpen, setAdvancedOpen] = useState(
    (reason?.applicableStages?.length ?? 0) > 0 ||
      (reason?.requireInternalNotes ?? false)
  );
  const [saving, setSaving] = useState(false);

  /**
   * Eligibility is decided by the category, not by the user: every reason
   * outside `permanently_ineligible_reasons` is eligible to reapply. It is
   * sent explicitly so moving a reason OUT of the ineligible category does not
   * leave the old value behind.
   */
  const isIneligibleCategory = category === 'permanently_ineligible_reasons';

  async function handleSave() {
    if (!label.trim()) {
      toast.error('Label is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: label.trim(),
        category,
        isActive,
        applicableStages: applicableStages
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        defaultEligibility: isIneligibleCategory
          ? ('permanently_ineligible' as const)
          : ('eligible' as const),
        requireInternalNotes,
      };
      if (reason) {
        await patchJson(`/ats/disposition-reasons/${reason._id}`, payload);
        toast.success('Rejection reason updated');
      } else {
        await postJson('/ats/disposition-reasons', payload);
        toast.success('Rejection reason created');
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      {/* Fixed width: a right-side SheetContent shrink-wraps its content, so
          opening the Advanced disclosure would otherwise widen the sheet
          leftward. The max-width keeps it on-screen at narrow viewports. */}
      <SheetContent
        key={`sheet-${sheetKey}`}
        className="w-md max-w-[calc(100vw-2rem)] flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>
            {isEdit ? 'Edit Rejection Reason' : 'New Rejection Reason'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update the reason that recruiters can select when rejecting a candidate.'
              : 'Add a new reason for rejecting a candidate.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto flex-1 min-h-0">
          <div className="flex flex-col gap-2">
            <Label>Label *</Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Insufficient experience"
              maxLength={200}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={v => setCategory(v as DispositionReasonCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(CATEGORY_LABELS) as DispositionReasonCategory[]
                ).map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isIneligibleCategory && (
              <p className="text-xs text-muted-foreground">
                Rejecting with this reason makes the candidate permanently
                ineligible — they cannot reapply.
              </p>
            )}
          </div>

          {/* Only meaningful on an existing reason — a new one is always active. */}
          {isEdit && (
            <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive reasons won&apos;t appear in the reject dialog. Turn
                  this off instead of deleting to keep past rejections readable.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                aria-label="Active"
                className="shrink-0"
              />
            </div>
          )}

          <ReasonAdvancedOptions
            open={advancedOpen}
            onOpenChange={setAdvancedOpen}
            applicableStages={applicableStages}
            onApplicableStagesChange={setApplicableStages}
            requireInternalNotes={requireInternalNotes}
            onRequireInternalNotesChange={setRequireInternalNotes}
          />
        </div>
        <SheetFooter className="flex-row items-center justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !label.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

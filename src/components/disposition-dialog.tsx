import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApplicationStore } from '@/store/slices/applications.store';
import {
  CATEGORY_LABELS,
  useDispositionReasonsStore,
  type DispositionReason,
  type DispositionReasonCategory,
} from '@/store/slices/disposition-reasons.store';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface DispositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  currentStageName?: string;
}

export function DispositionDialog({
  open,
  onOpenChange,
  applicationId,
  currentStageName,
}: DispositionDialogProps) {
  const { activeReasons, loading, fetchActive } = useDispositionReasonsStore();
  const dispose = useApplicationStore(s => s.dispose);

  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [destination, setDestination] = useState<
    'candidate_pool' | 'permanently_ineligible'
  >('candidate_pool');
  const [internalNotes, setInternalNotes] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmMove, setConfirmMove] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset dialog form by remounting inner content on each open.
  const [formKey, setFormKey] = useState(0);

  // Fetch reasons when dialog opens + bump remount key.
  useEffect(() => {
    if (open) {
      fetchActive(currentStageName);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormKey(k => k + 1);
    }
  }, [open, currentStageName, fetchActive]);

  const selectedReason = useMemo(
    () => activeReasons.find(r => r._id === selectedReasonId) ?? null,
    [activeReasons, selectedReasonId]
  );

  const notesRequired = selectedReason?.requireInternalNotes ?? false;
  const isIneligibleReason =
    selectedReason?.category === 'permanently_ineligible_reasons';

  // Group reasons by category
  const grouped = useMemo(() => {
    const map = new Map<DispositionReasonCategory, DispositionReason[]>();
    for (const r of activeReasons) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [activeReasons]);

  const canSubmit =
    selectedReasonId &&
    destination &&
    (!notesRequired || internalNotes.trim().length > 0) &&
    confirmClose &&
    confirmRemove &&
    confirmMove &&
    !submitting;

  const destinationLabel =
    destination === 'candidate_pool'
      ? 'Candidate Pool'
      : 'Permanently Ineligible';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await dispose(applicationId, {
        dispositionReasonId: selectedReasonId,
        destination,
        internalNotes: internalNotes.trim() || undefined,
      });
      toast.success('Candidate disposition complete');
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to dispose candidate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <div key={`dispose-form-${formKey}`}>
          <DialogHeader>
            <DialogTitle>Dispose Candidate</DialogTitle>
            <DialogDescription>
              Close this application and move the candidate out of the active
              pipeline. The candidate profile and history will be preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Destination */}
            <div className="space-y-2">
              <Label>Final Destination</Label>
              <Select
                value={destination}
                onValueChange={v =>
                  setDestination(
                    v as 'candidate_pool' | 'permanently_ineligible'
                  )
                }
                disabled={isIneligibleReason}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candidate_pool">Candidate Pool</SelectItem>
                  <SelectItem value="permanently_ineligible">
                    Permanently Ineligible
                  </SelectItem>
                </SelectContent>
              </Select>
              {isIneligibleReason && (
                <p className="text-xs text-muted-foreground">
                  Destination locked to Permanently Ineligible due to selected
                  reason.
                </p>
              )}
            </div>

            {/* Disposition Reason */}
            <div className="space-y-2">
              <Label>Disposition Reason *</Label>
              <Select
                value={selectedReasonId}
                onValueChange={id => {
                  setSelectedReasonId(id);
                  const reason = activeReasons.find(r => r._id === id);
                  if (reason?.category === 'permanently_ineligible_reasons') {
                    setDestination('permanently_ineligible');
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Array.from(grouped.entries()).map(([category, reasons]) => (
                    <SelectGroup key={category}>
                      <SelectLabel>{CATEGORY_LABELS[category]}</SelectLabel>
                      {reasons.map(r => (
                        <SelectItem key={r._id} value={r._id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Internal Notes */}
            <div className="space-y-2">
              <Label>
                Internal Notes
                {notesRequired && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <Textarea
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                placeholder={
                  notesRequired
                    ? 'Required for this disposition reason'
                    : 'Optional notes about this disposition'
                }
                rows={3}
              />
            </div>

            {/* Confirmations */}
            <div className="space-y-3 border rounded-md p-3">
              <p className="text-sm font-medium text-muted-foreground">
                Please confirm the following:
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm-close"
                  checked={confirmClose}
                  onCheckedChange={v => setConfirmClose(!!v)}
                />
                <Label
                  htmlFor="confirm-close"
                  className="text-sm font-normal cursor-pointer"
                >
                  The application will be closed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm-remove"
                  checked={confirmRemove}
                  onCheckedChange={v => setConfirmRemove(!!v)}
                />
                <Label
                  htmlFor="confirm-remove"
                  className="text-sm font-normal cursor-pointer"
                >
                  The candidate will be removed from the active pipeline
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm-move"
                  checked={confirmMove}
                  onCheckedChange={v => setConfirmMove(!!v)}
                />
                <Label
                  htmlFor="confirm-move"
                  className="text-sm font-normal cursor-pointer"
                >
                  The candidate will be moved to:{' '}
                  <span className="font-semibold">{destinationLabel}</span>
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              variant="destructive"
            >
              {submitting ? 'Processing...' : 'Confirm Disposition'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from '@/components/ui/button';
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
import {
  CATEGORY_LABELS,
  useDispositionReasonsStore,
  type DispositionReason,
  type DispositionReasonCategory,
} from '@/store/slices/disposition-reasons.store';
import { useEffect, useMemo, useState } from 'react';

export interface RejectPayload {
  rejectionReasonId: string;
  destination?: 'candidate_pool' | 'permanently_ineligible';
  internalNotes?: string;
}

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Candidate display name, used in the copy. */
  candidateName?: string;
  /** Job the rejection applies to, when rejecting a pipeline application. */
  jobTitle?: string;
  /**
   * Whether the candidate has another live application.
   * When true the destination is not offered — a non-final reject must not
   * ban or pool the candidate, because that would silently destroy the other
   * job's pipeline. See CANDIDATE-FLOW-SPEC.md §4.8.
   */
  hasOtherLiveApplication?: boolean;
  /** Optional pipeline stage, used to narrow applicable reasons. */
  currentStageName?: string;
  submitting?: boolean;
  onConfirm: (payload: RejectPayload) => void;
}

/**
 * Unified Reject dialog.
 *
 * The form lives in an inner component so its state resets naturally: Radix
 * unmounts the dialog content while closed, so every open starts from a clean
 * form without needing a reset effect.
 */
export function RejectDialog({
  open,
  onOpenChange,
  candidateName,
  jobTitle,
  hasOtherLiveApplication = false,
  currentStageName,
  submitting = false,
  onConfirm,
}: RejectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {open && (
          <RejectForm
            candidateName={candidateName}
            jobTitle={jobTitle}
            hasOtherLiveApplication={hasOtherLiveApplication}
            currentStageName={currentStageName}
            submitting={submitting}
            onCancel={() => onOpenChange(false)}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RejectForm({
  candidateName,
  jobTitle,
  hasOtherLiveApplication,
  currentStageName,
  submitting,
  onCancel,
  onConfirm,
}: {
  candidateName?: string;
  jobTitle?: string;
  hasOtherLiveApplication: boolean;
  currentStageName?: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (payload: RejectPayload) => void;
}) {
  const { activeReasons, loading, fetchActive } = useDispositionReasonsStore();

  const [selectedReasonId, setSelectedReasonId] = useState('');
  const [destination, setDestination] = useState<
    'candidate_pool' | 'permanently_ineligible'
  >('candidate_pool');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    fetchActive(currentStageName);
  }, [currentStageName, fetchActive]);

  const selectedReason = useMemo(
    () => activeReasons.find(r => r._id === selectedReasonId) ?? null,
    [activeReasons, selectedReasonId]
  );

  const notesRequired = selectedReason?.requireInternalNotes ?? false;
  const isIneligibleReason =
    selectedReason?.category === 'permanently_ineligible_reasons';

  // A permanently-ineligible reason always wins, so the destination is locked.
  const destinationLocked = isIneligibleReason;
  const effectiveDestination = isIneligibleReason
    ? 'permanently_ineligible'
    : destination;

  // Destination is only offered on a candidate's last live application.
  const showDestination = !hasOtherLiveApplication;

  const grouped = useMemo(() => {
    const map = new Map<DispositionReasonCategory, DispositionReason[]>();
    for (const r of activeReasons) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [activeReasons]);

  const canSubmit = selectedReasonId.length > 0 && (!notesRequired || internalNotes.trim().length > 0) && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm({
      rejectionReasonId: selectedReasonId,
      ...(showDestination ? { destination: effectiveDestination } : {}),
      ...(internalNotes.trim() ? { internalNotes: internalNotes.trim() } : {}),
    });
  };

  const subject = jobTitle ? (
    <>
      {candidateName ?? 'This candidate'} for{' '}
      <span className="font-medium">{jobTitle}</span>
    </>
  ) : (
    <>{candidateName ?? 'This candidate'}</>
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reject Candidate</DialogTitle>
        <DialogDescription>
          Rejecting {subject} closes out the application and removes them from
          the active pipeline. Their profile and history are preserved.
        </DialogDescription>
      </DialogHeader>

        <div className="space-y-5 py-2">
            {/* Destination — hidden while another live application remains */}
            {showDestination ? (
              <div className="space-y-2">
                <Label>Final Destination</Label>
                <Select
                  value={effectiveDestination}
                  onValueChange={v =>
                    setDestination(
                      v as 'candidate_pool' | 'permanently_ineligible'
                    )
                  }
                  disabled={destinationLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="candidate_pool">
                      Talent Pool — keep for future roles
                    </SelectItem>
                    <SelectItem value="permanently_ineligible">
                      Permanently Ineligible — never hire again
                    </SelectItem>
                  </SelectContent>
                </Select>
                {destinationLocked && (
                  <p className="text-xs text-muted-foreground">
                    Destination locked to Permanently Ineligible due to the
                    selected reason.
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {candidateName ?? 'This candidate'} is still in the pipeline for
                another job. This reject removes them from{' '}
                <span className="font-medium">
                  {jobTitle ?? 'this job'}
                </span>{' '}
                only — Talent Pool and Ineligible are not offered because
                either would affect their other applications.
              </p>
            )}

            {/* Structured reason */}
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Select
                value={selectedReasonId}
                onValueChange={setSelectedReasonId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent className="max-h-75">
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
              {!loading && activeReasons.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No rejection reasons configured. Add them under Settings →
                  Rejection Reasons.
                </p>
              )}
            </div>

            {/* Internal notes */}
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
                    ? 'Required for this reason'
                    : 'Optional notes about this rejection'
                }
                rows={3}
              />
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
          >
            {submitting ? 'Rejecting…' : 'Reject'}
          </Button>
        </DialogFooter>
    </>
  );
}

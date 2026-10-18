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
import { Textarea } from '@/components/ui/textarea';
import { useDispositionReasonsStore } from '@/store/slices/disposition-reasons.store';
import { useEffect, useMemo, useState } from 'react';
import {
  DestinationField,
  type RejectDestination,
} from './reject/destination-field';
import { ReasonPicker } from './reject/reason-picker';

export interface RejectPayload {
  rejectionReasonId: string;
  destination?: RejectDestination;
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
  const [destination, setDestination] = useState<RejectDestination>('candidate_pool');
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

  const canSubmit =
    selectedReasonId.length > 0 &&
    (!notesRequired || internalNotes.trim().length > 0) &&
    !submitting;

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
        {showDestination ? (
          <DestinationField
            value={effectiveDestination}
            locked={destinationLocked}
            onChange={setDestination}
          />
        ) : (
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {candidateName ?? 'This candidate'} is still in the pipeline for
            another job. This reject removes them from{' '}
            <span className="font-medium">{jobTitle ?? 'this job'}</span> only —
            Talent Pool and Ineligible are not offered because either would
            affect their other applications.
          </p>
        )}

        <ReasonPicker
          reasons={activeReasons}
          loading={loading}
          selectedReasonId={selectedReasonId}
          onSelect={setSelectedReasonId}
        />

        <div className="space-y-2">
          <Label>
            Internal Notes
            {notesRequired && <span className="text-destructive ml-1">*</span>}
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

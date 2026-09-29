import { Badge } from '@/components/ui/badge';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  CATEGORY_LABELS,
  useDispositionReasonsStore,
  type DispositionReason,
  type DispositionReasonCategory,
} from '@/store/slices/disposition-reasons.store';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  const [reasonSearch, setReasonSearch] = useState('');
  const [reasonPickerOpen, setReasonPickerOpen] = useState(false);
  const reasonSearchRef = useRef<HTMLInputElement>(null);

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

  /**
   * Filter, then group. The seeded list holds ~50 reasons, so a search box is
   * the only practical way to find one. Matching also covers the category name,
   * so typing "interview" surfaces that whole group rather than only the
   * reasons whose label happens to contain the word.
   */
  const grouped = useMemo(() => {
    const q = reasonSearch.trim().toLowerCase();
    const matches = q
      ? activeReasons.filter(
          r =>
            r.label.toLowerCase().includes(q) ||
            CATEGORY_LABELS[r.category].toLowerCase().includes(q)
        )
      : activeReasons;

    const map = new Map<DispositionReasonCategory, DispositionReason[]>();
    for (const r of matches) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [activeReasons, reasonSearch]);

  const matchCount = useMemo(
    () => Array.from(grouped.values()).reduce((n, list) => n + list.length, 0),
    [grouped]
  );

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
        {/* Destination — hidden while another live application remains */}
        {showDestination ? (
          <div className="space-y-2">
            <Label>Final Destination</Label>
            <Select
              value={effectiveDestination}
              onValueChange={v =>
                setDestination(v as 'candidate_pool' | 'permanently_ineligible')
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
                Destination locked to Permanently Ineligible due to the selected
                reason.
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {candidateName ?? 'This candidate'} is still in the pipeline for
            another job. This reject removes them from{' '}
            <span className="font-medium">{jobTitle ?? 'this job'}</span> only —
            Talent Pool and Ineligible are not offered because either would
            affect their other applications.
          </p>
        )}

        {/* Structured reason */}
        <div className="space-y-2">
          <Label>Rejection Reason *</Label>
          <Popover open={reasonPickerOpen} onOpenChange={setReasonPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                aria-label="Rejection reason"
                className="w-full justify-between font-normal text-sm"
              >
                <span
                  className={cn(
                    'truncate',
                    !selectedReason && 'text-muted-foreground'
                  )}
                >
                  {selectedReason
                    ? selectedReason.label
                    : loading
                      ? 'Loading reasons…'
                      : 'Select a reason…'}
                </span>
                <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-(--radix-popover-trigger-width) p-0"
              align="start"
              onOpenAutoFocus={e => {
                // Radix focuses the content container first; send it to the
                // search field instead so the user can type immediately.
                e.preventDefault();
                reasonSearchRef.current?.focus();
              }}
            >
              <div className="flex items-center gap-2 border-b px-3">
                <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
                <input
                  ref={reasonSearchRef}
                  value={reasonSearch}
                  onChange={e => setReasonSearch(e.target.value)}
                  placeholder="Search reasons…"
                  className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <div className="max-h-72 overflow-y-auto overscroll-contain p-1">
                {Array.from(grouped.entries()).map(([category, items]) => (
                  <div key={category}>
                    <p className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      {CATEGORY_LABELS[category]}
                    </p>
                    {items.map(r => {
                      const isSelected = r._id === selectedReasonId;
                      return (
                        <button
                          key={r._id}
                          type="button"
                          onClick={() => {
                            setSelectedReasonId(r._id);
                            setReasonSearch('');
                            setReasonPickerOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                            isSelected && 'bg-accent'
                          )}
                        >
                          <CheckIcon
                            className={cn(
                              'size-3.5 shrink-0',
                              !isSelected && 'invisible'
                            )}
                          />
                          <span className="flex-1 truncate">{r.label}</span>
                          {/* Choosing one of these bans the candidate from
                              reapplying, so flag it before it is picked. */}
                          {r.category === 'permanently_ineligible_reasons' && (
                            <Badge
                              variant="outline"
                              className="shrink-0 border-destructive/40 text-[10px] text-destructive"
                            >
                              Never rehire
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {matchCount === 0 && activeReasons.length > 0 && (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    No reasons match &ldquo;{reasonSearch}&rdquo;
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
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

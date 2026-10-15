import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { RejectDialog } from '@/components/reject-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { useCandidateBulkActions } from '../_hooks/use-candidate-bulk-actions';

interface BulkActionDialogsProps {
  bulk: ReturnType<typeof useCandidateBulkActions>;
  jobIdFilter: string;
}

export function BulkActionDialogs({ bulk, jobIdFilter }: BulkActionDialogsProps) {
  const {
    selectedCount,
    bulkActing,
    bulkStageOpen,
    setBulkStageOpen,
    bulkStageId,
    setBulkStageId,
    bulkStageOptions,
    bulkRejectOpen,
    setBulkRejectOpen,
    bulkPoolMoveOpen,
    setBulkPoolMoveOpen,
    bulkComposeOpen,
    setBulkComposeOpen,
    bulkComposeMode,
    handleBulkMoveStage,
    handleBulkReject,
    handleBulkMoveToTalentPool,
  } = bulk;

  return (
    <>
      {/* Bulk Move to Stage Dialog */}
      <Dialog open={bulkStageOpen} onOpenChange={setBulkStageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move to Stage</DialogTitle>
            <DialogDescription>
              Move {selectedCount} selected{' '}
              {selectedCount === 1 ? 'candidate' : 'candidates'} to a pipeline
              stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Select Stage</Label>
            <Select value={bulkStageId} onValueChange={setBulkStageId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a stage..." />
              </SelectTrigger>
              <SelectContent>
                {bulkStageOptions.map(s => (
                  <SelectItem key={s._id} value={s._id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStageOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkMoveStage}
              disabled={!bulkStageId || bulkActing}
            >
              {bulkActing ? 'Moving…' : 'Move Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject — same reason + destination dialog as the single flow */}
      <RejectDialog
        open={bulkRejectOpen}
        onOpenChange={setBulkRejectOpen}
        candidateName={`${selectedCount} selected ${selectedCount === 1 ? 'candidate' : 'candidates'}`}
        submitting={bulkActing}
        onConfirm={handleBulkReject}
      />

      {/* Bulk remove from job → Talent Pool */}
      <ConfirmDialog
        open={bulkPoolMoveOpen}
        onOpenChange={setBulkPoolMoveOpen}
        title="Remove from job and move to Talent Pool"
        description={`${selectedCount} selected ${selectedCount === 1 ? 'candidate' : 'candidates'} will be removed from ${jobIdFilter ? 'this job' : 'their current job'} and added to the Talent Pool. This is not a rejection. They can be assigned to another job later from the Talent Pool page.`}
        confirmLabel="Move to Talent Pool"
        loading={bulkActing}
        onConfirm={handleBulkMoveToTalentPool}
      />

      {/* Bulk email — one send, every selected address in the To list */}
      <ComposeEmailSheet
        open={bulkComposeOpen}
        onOpenChange={setBulkComposeOpen}
        mode={bulkComposeMode}
      />
    </>
  );
}

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DeleteCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  loading: boolean;
  onConfirm: () => void;
}

/** The only permanent-delete path in the ATS. */
export function DeleteCandidateDialog({
  open,
  onOpenChange,
  candidateName,
  loading,
  onConfirm,
}: DeleteCandidateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Permanently Delete Candidate
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-3 pt-2">
            <p>
              This will permanently delete{' '}
              <span className="font-medium text-foreground">
                {candidateName}
              </span>{' '}
              and all associated data — applications, interviews, emails, and
              history — across every job.
            </p>
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-xs">
              This action <em>cannot</em> be undone. To keep their history
              instead, use Restore.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button variant="destructive" disabled={loading} onClick={onConfirm}>
            {loading ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

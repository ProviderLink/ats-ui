import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Candidate } from '@/store/types';

interface PermanentDeleteDialogProps {
  candidate: Candidate | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: (candidate: Candidate) => void;
}

export function PermanentDeleteDialog({
  candidate,
  deleting,
  onClose,
  onConfirm,
}: PermanentDeleteDialogProps) {
  return (
    <Dialog open={!!candidate} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Permanently Delete Candidate
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-3 pt-2">
            <p>
              This will permanently delete{' '}
              <span className="font-medium text-foreground">
                {candidate
                  ? `${candidate.firstName} ${candidate.lastName}`
                  : 'this candidate'}
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
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleting}
            onClick={() => candidate && onConfirm(candidate)}
          >
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

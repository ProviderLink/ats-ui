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

/** Radix Select forbids an empty-string item value, so the "use the first
 * stage" option needs a non-empty sentinel that we map back to undefined. */
export function RemoveTalentPoolConfirmDialog({
  candidate,
  open,
  onClose,
  onConfirm,
}: {
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!candidate) return null;
  const name = `${candidate.firstName} ${candidate.lastName}`;
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove from Talent Pool</DialogTitle>
          <DialogDescription className="flex flex-col gap-3 pt-2">
            <p>
              You are about to remove{' '}
              <span className="font-medium text-foreground">{name}</span> from
              the talent pool.
            </p>
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground">
              They will no longer appear in saved candidates. Nothing else
              changes — their profile and history are kept.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Remove from pool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

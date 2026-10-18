import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  applicationCount: number;
  deleting: boolean;
  onConfirm: () => void;
}

export function DeleteJobDialog({
  open,
  onOpenChange,
  jobTitle,
  applicationCount,
  deleting,
  onConfirm,
}: DeleteJobDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete job?</DialogTitle>
          <DialogDescription>
            <strong>{jobTitle}</strong> will be permanently removed. This cannot
            be undone.
            {applicationCount > 0 && (
              <span className="mt-2 block text-xs rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive font-medium">
                ⚠ This will also permanently delete {applicationCount}{' '}
                application{applicationCount > 1 ? 's' : ''} for this job.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={deleting}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

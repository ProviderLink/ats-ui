import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Client } from '@/store/types';
import { Loader2Icon } from 'lucide-react';

interface DeleteClientDialogProps {
  client: Client | null;
  jobCount: number;
  applicationCount: number;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteClientDialog({
  client,
  jobCount,
  applicationCount,
  deleting,
  onClose,
  onConfirm,
}: DeleteClientDialogProps) {
  return (
    <Dialog open={!!client} onOpenChange={open => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete client?</DialogTitle>
          <DialogDescription>
            <strong>{client?.companyName}</strong> will be permanently removed.
            This cannot be undone.
            {(jobCount > 0 || applicationCount > 0) && (
              <span className="mt-2 block text-destructive font-medium text-xs rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                ⚠ This will also permanently delete{' '}
                {jobCount > 0 && (
                  <>
                    {jobCount} job{jobCount > 1 ? 's' : ''}
                  </>
                )}
                {jobCount > 0 && applicationCount > 0 && ' and '}
                {applicationCount > 0 && (
                  <>
                    {applicationCount} application
                    {applicationCount > 1 ? 's' : ''}
                  </>
                )}{' '}
                associated with this client.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? <Loader2Icon className="size-4 animate-spin" /> : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

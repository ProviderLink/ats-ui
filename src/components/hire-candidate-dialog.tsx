import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface HireCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  jobTitle?: string;
  loading: boolean;
  onConfirm: () => void;
}

export function HireCandidateDialog({
  open,
  onOpenChange,
  candidateName,
  jobTitle,
  loading,
  onConfirm,
}: HireCandidateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hire Candidate</DialogTitle>
          <DialogDescription>
            Mark <span className="font-medium">{candidateName}</span> as hired
            for <span className="font-medium">{jobTitle ?? 'this job'}</span>?
            This completes the pipeline.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? 'Hiring…' : 'Confirm Hire'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckIcon, Loader2Icon } from 'lucide-react';

interface ApproveJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  hasJobApplied: boolean;
  openJobs: { _id: string; title: string }[];
  selectedJobId: string;
  onSelectedJobIdChange: (id: string) => void;
  acting: boolean;
  onConfirm: () => void;
}

export function ApproveJobDialog({
  open,
  onOpenChange,
  candidateName,
  hasJobApplied,
  openJobs,
  selectedJobId,
  onSelectedJobIdChange,
  acting,
  onConfirm,
}: ApproveJobDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve {candidateName}</DialogTitle>
          <DialogDescription>
            {hasJobApplied
              ? 'This will approve the candidate and create an application for the job they applied to. AI scoring will run automatically.'
              : 'This candidate did not apply through a job posting. Choose the job to approve them into — an application is created at the first pipeline stage.'}
          </DialogDescription>
        </DialogHeader>
        {!hasJobApplied && (
          <div className="space-y-3">
            <Label>Select Job</Label>
            <Select value={selectedJobId} onValueChange={onSelectedJobIdChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job..." />
              </SelectTrigger>
              <SelectContent>
                {openJobs.map(j => (
                  <SelectItem key={j._id} value={j._id}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={acting || (!hasJobApplied && !selectedJobId)}
          >
            {acting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CheckIcon className="size-4" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

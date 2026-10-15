import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TalentPoolToggleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  inTalentPool: boolean;
  loading: boolean;
  onConfirm: () => void;
}

export function TalentPoolToggleDialog({
  open,
  onOpenChange,
  candidateName,
  inTalentPool,
  loading,
  onConfirm,
}: TalentPoolToggleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {inTalentPool ? 'Remove from Talent Pool' : 'Add to Talent Pool'}
          </DialogTitle>
          <DialogDescription>
            {inTalentPool ? (
              <>
                Remove <span className="font-medium">{candidateName}</span>{' '}
                from the talent pool? They will no longer appear in saved
                candidates.
              </>
            ) : (
              <>
                Add <span className="font-medium">{candidateName}</span> to the
                talent pool? They will be saved for future opportunities.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            disabled={loading}
          >
            {inTalentPool ? 'Remove' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export function TalentPoolDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Talent Pool</DialogTitle>
          <DialogDescription className="sr-only">
            Add this candidate to the talent pool with an optional note.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>Notes (optional)</Label>
          <Textarea
            rows={3}
            placeholder="e.g. Available in 3 months. Prefers remote."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(notes);
              onClose();
            }}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StageShape } from '@/store/types';

interface MoveStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  stages: StageShape[];
  selectedStageId: string;
  onSelectedStageIdChange: (id: string) => void;
  currentStageId?: string;
  loading: boolean;
  onConfirm: () => void;
}

export function MoveStageDialog({
  open,
  onOpenChange,
  candidateName,
  stages,
  selectedStageId,
  onSelectedStageIdChange,
  currentStageId,
  loading,
  onConfirm,
}: MoveStageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Move Stage</DialogTitle>
          <DialogDescription>
            Advance <span className="font-medium">{candidateName}</span> to the
            next pipeline stage.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Select Stage</Label>
          <Select value={selectedStageId} onValueChange={onSelectedStageIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a stage..." />
            </SelectTrigger>
            <SelectContent>
              {stages
                .filter(s => s.isActive !== false)
                .map(s => (
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={
              !selectedStageId || loading || selectedStageId === currentStageId
            }
          >
            {loading ? 'Moving…' : 'Move Stage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

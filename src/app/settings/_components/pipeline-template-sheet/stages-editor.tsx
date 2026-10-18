import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { StageShape } from '@/store/types';
import { PlusIcon } from 'lucide-react';
import { StageRow } from './stage-row';

interface StagesEditorProps {
  stages: StageShape[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<StageShape>) => void;
  onRemove: (id: string) => void;
}

export function StagesEditor({
  stages,
  onAdd,
  onUpdate,
  onRemove,
}: StagesEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>Stages</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={onAdd}
        >
          <PlusIcon className="size-3" /> Add stage
        </Button>
      </div>

      {stages.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4 border rounded-md">
          No stages yet. Add one above.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {stages.map((stage, i) => (
          <StageRow
            key={stage._id}
            stage={stage}
            index={i}
            onChange={patch => onUpdate(stage._id, patch)}
            onRemove={() => onRemove(stage._id)}
          />
        ))}
      </div>
    </div>
  );
}

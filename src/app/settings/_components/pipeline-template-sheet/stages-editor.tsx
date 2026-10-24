import { Button } from '@/components/ui/button';
import type { StageShape } from '@/store/types';
import { PlusIcon } from 'lucide-react';
import { SectionHeading } from '../template-ui';
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
    <section className="flex flex-col gap-3">
      <SectionHeading
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 border-blue-300 bg-blue-100 px-2.5 text-xs text-blue-800 hover:bg-blue-200 hover:text-blue-900 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-accent"
            onClick={onAdd}
          >
            <PlusIcon className="size-3.5" /> Add stage
          </Button>
        }
      >
        Stages ({stages.length})
      </SectionHeading>

      {stages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-xs text-muted-foreground dark:border-border">
          No stages yet. Use “Add stage” to create the first one.
        </p>
      ) : (
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
      )}
    </section>
  );
}

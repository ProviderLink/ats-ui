import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { StageShape } from '@/store/types';
import { Trash2Icon } from 'lucide-react';
import { StageIconPicker } from './stage-icon-picker';

interface StageRowProps {
  stage: StageShape;
  index: number;
  onChange: (patch: Partial<StageShape>) => void;
  onRemove: () => void;
}

export function StageRow({ stage, index, onChange, onRemove }: StageRowProps) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/30">
      <span className="text-xs text-muted-foreground w-4 text-center shrink-0">
        {index + 1}
      </span>
      <StageIconPicker
        value={stage.icon}
        onChange={icon => onChange({ icon })}
      />
      <input
        type="color"
        value={stage.color}
        onChange={e => onChange({ color: e.target.value })}
        className="size-8 rounded-md cursor-pointer border border-input bg-transparent p-0.5"
        title="Stage color"
      />
      <Input
        value={stage.name}
        onChange={e => onChange({ name: e.target.value })}
        placeholder="Stage name"
        className="h-8 text-xs flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground hover:text-destructive shrink-0"
        onClick={onRemove}
        aria-label={`Remove stage ${stage.name || index + 1}`}
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}

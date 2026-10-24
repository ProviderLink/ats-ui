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
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-border dark:bg-white/3">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-medium tabular-nums text-gray-700 dark:bg-muted dark:text-muted-foreground">
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
        className="size-8 shrink-0 cursor-pointer appearance-none rounded-md border border-gray-300 bg-transparent p-0.5 dark:border-input [&::-webkit-color-swatch]:rounded-[4px] [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        title="Stage color"
      />
      <Input
        value={stage.name}
        onChange={e => onChange({ name: e.target.value })}
        placeholder="Stage name"
        maxLength={100}
        className="h-8 text-xs flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="shrink-0 text-gray-500 hover:bg-red-100 hover:text-red-700 dark:text-muted-foreground dark:hover:bg-destructive/10 dark:hover:text-destructive"
        onClick={onRemove}
        aria-label={`Remove stage ${stage.name || index + 1}`}
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}

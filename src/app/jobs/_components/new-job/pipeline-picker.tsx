import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PipelineTemplate } from '@/store';

interface PipelinePickerProps {
  pipelines: PipelineTemplate[];
  value: string;
  onChange: (value: string) => void;
}

export function PipelinePicker({
  pipelines,
  value,
  onChange,
}: PipelinePickerProps) {
  const selected = pipelines.find(p => p._id === value);

  return (
    <div className="rounded-lg border bg-muted/30 dark:bg-white/[0.02] p-4 flex flex-col gap-3">
      <Label className="flex items-center gap-1 text-sm">
        Pipeline
        <span className="text-destructive text-xs leading-none">*</span>
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-background w-full [&>[data-slot=select-value]]:truncate">
          <SelectValue placeholder="Select a pipeline" />
        </SelectTrigger>
        <SelectContent className="max-w-[calc(100vw-2rem)]">
          {pipelines.map(p => (
            <SelectItem key={p._id} value={p._id}>
              <span className="truncate">
                {p.name}
                {p.isDefault ? ' (Default)' : ''}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <div className="flex flex-col gap-2 pt-1 border-t">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
            Stages
          </p>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
            {selected.stages
              .filter(s => s.isActive)
              .sort((a, b) => a.order - b.order)
              .map((stage, i, arr) => (
                <span key={stage._id} className="flex items-center gap-1">
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${stage.color}15`,
                      color: stage.color,
                    }}
                  >
                    {stage.name}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="text-[10px] text-muted-foreground/35">
                      →
                    </span>
                  )}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

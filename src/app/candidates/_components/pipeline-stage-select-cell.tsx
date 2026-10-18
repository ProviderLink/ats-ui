import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { timeAgo } from '@/lib/utils';
import { useApplicationStore } from '@/store/slices/applications.store';
import type { Job } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';

export function PipelineStageSelectCell({
  applicationId,
  stageId,
  assignedAt,
  stages,
  onOpenChange,
}: {
  applicationId: string;
  stageId: string;
  assignedAt?: string;
  stages: NonNullable<Job['pipeline']>['stages'];
  onOpenChange?: (open: boolean) => void;
}) {
  const appMoveStage = useApplicationStore(s => s.moveStage);
  const [changing, setChanging] = useState(false);

  async function handleChange(newStageId: string) {
    if (newStageId === stageId) return;
    setChanging(true);
    try {
      await appMoveStage(applicationId, newStageId);
      toast.success('Pipeline stage updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setChanging(false);
    }
  }

  return (
    <div
      className="flex w-full min-w-0 flex-col gap-1"
      onClick={e => e.stopPropagation()}
    >
      <Select
        value={stageId}
        onValueChange={handleChange}
        onOpenChange={onOpenChange}
        disabled={changing || stages.length === 0}
      >
        <SelectTrigger
          size="sm"
          className="w-full min-w-40 max-w-64 min-h-8 items-start whitespace-normal rounded-sm border border-dashed border-muted-foreground/25 bg-transparent px-1.5 py-1 shadow-none hover:bg-foreground/5 dark:hover:bg-white/5 data-[state=open]:bg-foreground/5 data-[size=sm]:h-auto *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:items-start *:data-[slot=select-value]:whitespace-normal *:data-[slot=select-value]:text-left [&_svg]:mt-0.5 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground/50"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border border-border bg-popover shadow-lg ring-1 ring-black/10 dark:ring-white/10">
          {stages
            .filter(s => s.isActive !== false)
            .map(s => (
              <SelectItem key={s._id} value={s._id}>
                <span className="flex items-start gap-2">
                  <span
                    className="size-2 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="whitespace-normal">{s.name}</span>
                </span>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {assignedAt && (
        <span className="text-xs text-muted-foreground pl-0.5">
          {timeAgo(assignedAt)}
        </span>
      )}
    </div>
  );
}

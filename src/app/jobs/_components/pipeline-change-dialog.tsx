import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Job, PipelineTemplate } from '@/store';
import { Loader2Icon } from 'lucide-react';
import { usePipelineChange } from '../_hooks/use-pipeline-change';
import { ChangeSummary } from './pipeline-change-dialog/change-summary';
import { RemapTable } from './pipeline-change-dialog/remap-table';

interface PipelineChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  newTemplate: PipelineTemplate;
  loading: boolean;
  onConfirm: (stageMapping?: Record<string, string>) => void | Promise<void>;
}

export function PipelineChangeDialog({
  open,
  onOpenChange,
  job,
  newTemplate,
  loading,
  onConfirm,
}: PipelineChangeDialogProps) {
  const change = usePipelineChange({
    open,
    job,
    newTemplate,
    loading,
    onOpenChange,
    onConfirm,
  });
  const { oldStages, newStages, isLoading, showRemapper } = change;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change Pipeline</DialogTitle>
          <DialogDescription>
            Switching from{' '}
            <span className="font-medium text-foreground">
              {oldStages.length > 0
                ? oldStages.map(s => s.name).join(' → ')
                : 'no pipeline'}
            </span>{' '}
            to{' '}
            <span className="font-medium text-foreground">
              {newStages.map(s => s.name).join(' → ')}
            </span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : showRemapper && change.remapRows ? (
          <RemapTable
            rows={change.remapRows}
            newStages={newStages}
            onSelect={change.selectNewStage}
            onBack={change.closeRemap}
          />
        ) : (
          <ChangeSummary
            summary={change.summary}
            newStages={newStages}
            totalCandidates={change.totalCandidates}
            matchedCount={change.matchedCount}
            unmatchedCount={change.unmatchedCount}
            pendingCount={change.pendingCount}
          />
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          {!showRemapper &&
            change.totalCandidates > 0 &&
            change.unmatchedCount > 0 && (
              <Button
                variant="outline"
                onClick={change.startRemap}
                disabled={isLoading}
              >
                Fix Manually
              </Button>
            )}
          <Button onClick={change.confirm} disabled={isLoading}>
            {isLoading && <Loader2Icon className="size-4 animate-spin mr-1" />}
            {showRemapper ? 'Apply Mapping' : 'Confirm Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

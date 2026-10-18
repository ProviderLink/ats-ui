import { Badge } from '@/components/ui/badge';
import type { StageShape } from '@/store';
import { AlertTriangleIcon, ArrowRightIcon, CheckCircle2Icon } from 'lucide-react';
import type { StageSummary } from '../../_utils/pipeline-change';

interface ChangeSummaryProps {
  summary: StageSummary[];
  newStages: StageShape[];
  totalCandidates: number;
  matchedCount: number;
  unmatchedCount: number;
  pendingCount: number;
}

export function ChangeSummary({
  summary,
  newStages,
  totalCandidates,
  matchedCount,
  unmatchedCount,
  pendingCount,
}: ChangeSummaryProps) {
  if (totalCandidates === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No candidates are currently in pipeline stages. The pipeline will be
        changed without affecting any candidates.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
        <span>{matchedCount} candidates will stay in their current stage</span>
      </div>
      {unmatchedCount > 0 && (
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangleIcon className="size-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            {unmatchedCount} candidates will be moved to{' '}
            <strong>{newStages[0]?.name ?? 'Stage 1'}</strong> — their stage has
            no match in the new pipeline
          </span>
        </div>
      )}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowRightIcon className="size-4 shrink-0" />
          <span>{pendingCount} pending candidates are unaffected</span>
        </div>
      )}

      <div className="rounded-md border">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 border-b">
          <span>Old Stage</span>
          <span></span>
          <span>New Stage</span>
        </div>
        <div className="max-h-52 overflow-y-auto">
          {summary.map(s => (
            <div
              key={s.oldStage._id}
              className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center px-3 py-2 border-b last:border-b-0 text-sm"
            >
              <span className="truncate">{s.oldStage.name}</span>
              <span className="text-center text-muted-foreground text-xs">
                {s.candidateCount > 0 && (
                  <Badge variant="secondary" className="h-5 text-[10px]">
                    {s.candidateCount}
                  </Badge>
                )}
              </span>
              <span
                className={
                  s.matched
                    ? 'text-emerald-600 dark:text-emerald-400 truncate'
                    : 'text-amber-600 dark:text-amber-400 truncate'
                }
              >
                {s.newStageName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
import { CheckIcon, MoveRightIcon } from 'lucide-react';

export function PipelineProgressBar({
  stages,
  currentStageId,
}: {
  stages: { _id: string; name: string; color: string }[];
  currentStageId?: string | null;
}) {
  if (stages.length === 0) return null;
  const currentIdx = currentStageId
    ? stages.findIndex(s => s._id === currentStageId)
    : -1;
  const progressPct =
    currentIdx >= 0 ? Math.round((currentIdx / (stages.length - 1)) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-300 dark:bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground shrink-0 tabular-nums">
          {currentIdx >= 0 ? currentIdx + 1 : 0}/{stages.length}
        </span>
      </div>

      {/* Stage circles + arrows + labels */}
      <div className="flex items-start overflow-x-auto pb-1">
        {stages.map((s, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;
          const isLast = i === stages.length - 1;
          return (
            <div key={s._id} className="flex items-start shrink-0">
              {/* Stage column: circle + label */}
              <div className="flex flex-col items-center w-16 shrink-0">
                <div
                  className={cn(
                    'size-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors duration-300',
                    isCompleted &&
                      'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25',
                    isCurrent && 'text-white shadow-md',
                    isFuture &&
                      'bg-gray-200 text-gray-700 border-2 border-gray-400 dark:bg-muted dark:text-muted-foreground dark:border-border'
                  )}
                  style={
                    isCurrent
                      ? {
                          backgroundColor: s.color,
                          boxShadow: `0 0 0 3px ${s.color}20`,
                        }
                      : undefined
                  }
                >
                  {isCompleted ? (
                    <CheckIcon className="size-3" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[11px] text-center leading-snug mt-1.5',
                    isFuture
                      ? 'text-muted-foreground'
                      : 'font-semibold text-foreground'
                  )}
                >
                  {s.name}
                </span>
              </div>
              {/* Arrow between stages, aligned with circle center */}
              {!isLast && (
                <div
                  className="flex items-center shrink-0 w-6"
                  style={{ height: 24 }}
                >
                  <MoveRightIcon
                    className={cn(
                      'size-4 transition-colors duration-300',
                      i < currentIdx
                        ? 'text-emerald-500'
                        : isCurrent
                          ? 'text-emerald-400/50'
                          : 'text-gray-400 dark:text-muted-foreground/30'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

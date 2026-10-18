import { Badge } from '@/components/ui/badge';
import { getFitConfig, scoreBarColor, scoreTextColor } from '@/lib/candidate-styles';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import { SectionLabel } from './section-label';

/** Job-fit scoring for candidates in the pipeline. */
export function AiEvaluationSection({ candidate }: { candidate: Candidate } ) {
  const { aiScore } = candidate;
  if (candidate.status !== 'approved' || !aiScore) return null;

  const hasScoring = aiScore.score != null && aiScore.recommendation != null;
  const fitCfg = getFitConfig(aiScore.recommendation);
  const fitLabel = hasScoring ? fitCfg.label : null;
  const fitCls = hasScoring ? fitCfg.cls : '';

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>AI Evaluation</SectionLabel>
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                scoreBarColor(aiScore.score)
              )}
              style={{ width: `${aiScore.score}%` }}
            />
          </div>
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              scoreTextColor(aiScore.score)
            )}
          >
            {aiScore.score} / 100
          </span>
          <Badge
            className={cn(
              'bg-transparent font-medium shrink-0',
              fitCls
            )}
          >
            {fitLabel}
          </Badge>
        </div>
        {aiScore.summary && (
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            {aiScore.summary}
          </p>
        )}
      </div>
      {((aiScore.strengths?.length ?? 0) > 0 ||
        (aiScore.concerns?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(aiScore.strengths?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[#3d8a5a] dark:text-[#69c58a]">
                Strengths
              </p>
              <ul className="flex flex-col gap-1">
                {(aiScore.strengths ?? []).map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#69c58a]" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(aiScore.concerns?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-destructive">
                Concerns
              </p>
              <ul className="flex flex-col gap-1">
                {(aiScore.concerns ?? []).map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-destructive/70" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

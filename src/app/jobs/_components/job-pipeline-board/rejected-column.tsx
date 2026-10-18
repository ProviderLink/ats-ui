import type { Candidate } from '@/store';
import type { AppWithCandidate } from '../../_utils/pipeline-board';
import { RejectedCard } from './rejected-card';

interface RejectedColumnProps {
  pairs: AppWithCandidate[];
  onOpen: (c: Candidate) => void;
}

export function RejectedColumn({ pairs, onOpen }: RejectedColumnProps) {
  return (
    <div className="flex flex-col w-62.5 shrink-0 h-full">
      <div
        className="flex items-center justify-between gap-2 mb-2 px-3 py-2 rounded-lg border border-destructive/20 bg-destructive/5"
        style={{
          // `--destructive` is a complete oklch() colour, so it must not be
          // wrapped in `hsl(var(--destructive))`. Inline so the accent beats
          // the `border-destructive/20` class.
          borderLeftWidth: 3,
          borderLeftStyle: 'solid',
          borderLeftColor: 'var(--destructive)',
        }}
      >
        <span className="text-xs font-semibold tracking-wide truncate text-destructive/70">
          Rejected
        </span>
        <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full shrink-0 min-w-5 text-center bg-destructive/10 text-destructive/70">
          {pairs.length}
        </span>
      </div>
      <div className="flex-1 min-h-32 rounded-lg p-2 space-y-2 border border-dashed border-destructive/20 bg-destructive/2 overflow-y-auto">
        {pairs.map(pair => (
          <RejectedCard
            key={pair.application._id}
            candidate={pair.candidate}
            onOpen={() => onOpen(pair.candidate)}
          />
        ))}
      </div>
    </div>
  );
}

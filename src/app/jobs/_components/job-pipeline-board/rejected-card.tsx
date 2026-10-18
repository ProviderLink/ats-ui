import { avatarBg } from '@/lib/candidate-styles';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/store';

interface RejectedCardProps {
  candidate: Candidate;
  onOpen: () => void;
}

export function RejectedCard({ candidate, onOpen }: RejectedCardProps) {
  const score = candidate.aiScore?.score ?? 0;
  return (
    <div
      role="button"
      onClick={onOpen}
      className="rounded-lg border border-dashed bg-muted/50 p-3 w-full text-muted-foreground cursor-pointer hover:bg-muted/70 transition-colors opacity-60"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className={cn(
            'size-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 select-none opacity-50',
            avatarBg(candidate.firstName)
          )}
        >
          {candidate.firstName[0]}
          {candidate.lastName[0]}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight truncate line-through">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
            {candidate.email}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-1 pt-2 border-t border-dashed">
        <span className="text-[10px] font-medium text-destructive/70">
          Rejected
        </span>
        {score > 0 && (
          <span className="text-sm font-bold tabular-nums leading-none text-muted-foreground/50">
            {score}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The non-content states: loading, empty and error.
 *
 * The skeleton matches the new row height (32px) so the feed does not jump
 * when real entries land, and the same left rail is drawn so the transition
 * reads as a fill rather than a re-layout.
 */

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityIcon, AlertCircleIcon } from 'lucide-react';

export function ActivitySkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="relative flex flex-col">
      <span
        aria-hidden
        className="ats-activity-spine pointer-events-none absolute top-3 bottom-3 left-[11px] w-px"
      />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <Skeleton
            className="h-3"
            // Vary the width so the block reads as text, not as a table.
            style={{ width: `${70 - index * 9}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function ActivityEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
      <ActivityIcon className="size-5 text-muted-foreground/50" />
      <p className="text-xs text-muted-foreground">No activity yet.</p>
    </div>
  );
}

export function ActivityError({
  onRetry,
  retrying,
}: {
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-destructive/40 py-8 text-center">
      <AlertCircleIcon className="size-5 text-destructive/60" />
      <p className="text-xs text-muted-foreground">Could not load activity.</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        disabled={retrying}
        onClick={onRetry}
      >
        {retrying ? 'Retrying…' : 'Retry'}
      </Button>
    </div>
  );
}

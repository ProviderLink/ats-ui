import { Skeleton } from '@/components/ui/skeleton';
import { ActivityIcon } from 'lucide-react';

export function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="size-6 rounded-full" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ActivityEmptyStateProps {
  loadError?: string | null;
  isFiltered: boolean;
}

function emptyMessage({ loadError, isFiltered }: ActivityEmptyStateProps) {
  if (loadError) {
    return /permission/i.test(loadError)
      ? 'You don\u2019t have access to this activity.'
      : 'Couldn\u2019t load activity.';
  }
  return isFiltered ? 'Nothing here yet.' : 'No activity yet.';
}

export function ActivityEmptyState(props: ActivityEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
      <ActivityIcon className="size-5 text-muted-foreground/50" />
      <p className="text-xs text-muted-foreground">{emptyMessage(props)}</p>
    </div>
  );
}

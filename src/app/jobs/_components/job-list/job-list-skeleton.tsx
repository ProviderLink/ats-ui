import { Skeleton } from '@/components/ui/skeleton';

export function JobListSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b last:border-b-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

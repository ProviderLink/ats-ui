import { Skeleton } from '@/components/ui/skeleton';

export function EmailSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Skeleton className="size-4 rounded-sm mt-1 shrink-0" />
      <Skeleton className="size-7 rounded-md shrink-0" />
      <Skeleton className="size-8 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-5 w-16 rounded-full mt-1" />
      </div>
    </div>
  );
}

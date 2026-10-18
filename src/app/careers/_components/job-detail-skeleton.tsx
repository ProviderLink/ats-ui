import { Skeleton } from '@/components/ui/skeleton';

export function JobDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
      <Skeleton className="h-4 w-32 rounded-sm bg-white/10" />
      <div className="flex flex-col gap-5">
        <Skeleton className="h-10 w-2/3 rounded-sm bg-white/10" />
        <Skeleton className="h-4 w-1/2 rounded-sm bg-white/10" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl bg-white/10" />
      <Skeleton className="h-48 w-full rounded-2xl bg-white/10" />
      <Skeleton className="h-32 w-2/3 rounded-2xl bg-white/10" />
    </div>
  );
}

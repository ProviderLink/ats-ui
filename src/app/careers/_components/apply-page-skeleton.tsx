import { Skeleton } from '@/components/ui/skeleton';

export function ApplyPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-4 w-24 rounded-2xl bg-white/10" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-2/3 rounded-2xl bg-white/10" />
          <Skeleton className="h-5 w-1/2 rounded-2xl bg-white/10" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-2xl bg-white/10" />
          <Skeleton className="h-64 w-full rounded-2xl bg-white/10" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCwIcon } from 'lucide-react';

export function ThreadSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

export function ThreadError({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center py-16">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <RefreshCwIcon className="size-5 text-destructive" />
        </div>
        <p className="text-sm font-medium">Failed to load email</p>
        <p className="text-xs text-muted-foreground max-w-sm">{message}</p>
      </div>
    </div>
  );
}

export function ThreadNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-sm font-medium">Email not found</p>
        <p className="text-xs text-muted-foreground">
          This email may have been removed.
        </p>
      </div>
    </div>
  );
}

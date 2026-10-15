import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i} className="border-b last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j} className="px-4 py-3">
              <Skeleton className={cn('h-4', j === 0 ? 'w-36' : 'w-20')} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

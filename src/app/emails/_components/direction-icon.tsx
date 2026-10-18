import { cn } from '@/lib/utils';
import type { EmailDirection } from '@/store/types';
import { ArrowDownLeftIcon, ArrowUpRightIcon } from 'lucide-react';

export function DirectionIcon({ direction }: { direction: EmailDirection }) {
  const isOut = direction === 'outbound';
  return (
    <div
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md',
        isOut ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'
      )}
    >
      {isOut ? (
        <ArrowUpRightIcon className="size-3.5" />
      ) : (
        <ArrowDownLeftIcon className="size-3.5" />
      )}
    </div>
  );
}

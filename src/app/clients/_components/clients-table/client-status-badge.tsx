import { cn } from '@/lib/utils';
import type { ClientStatus } from '@/store/types';

const STATUS_CONFIG: Record<
  ClientStatus,
  { label: string; pill: string; dot: string }
> = {
  active: {
    label: 'Active',
    pill: 'bg-pine-teal-50 text-pine-teal-700 dark:bg-pine-teal-950/40 dark:text-pine-teal-300',
    dot: 'bg-pine-teal-500',
  },
  inactive: {
    label: 'Inactive',
    pill: 'bg-muted text-muted-foreground',
    dot: 'bg-silver-400',
  },
  suspended: {
    label: 'Suspended',
    pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const { label, pill, dot } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        pill
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />
      {label}
    </span>
  );
}

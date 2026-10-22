import { cn } from '@/lib/utils';
import type { ClientStatus } from '@/store/types';

const STATUS_CONFIG: Record<
  ClientStatus,
  { label: string; pill: string; dot: string }
> = {
  active: {
    label: 'Active',
    pill: 'border-[#2d8a51]/30 bg-[#2d8a51]/10 text-[#24703f] dark:border-[#69c58a]/30 dark:bg-[#69c58a]/10 dark:text-[#69c58a]',
    dot: 'bg-pine-teal-500',
  },
  inactive: {
    label: 'Inactive',
    pill: 'border-border bg-muted text-muted-foreground',
    dot: 'bg-silver-400',
  },
  suspended: {
    label: 'Suspended',
    pill: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const { label, pill, dot } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        pill
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />
      {label}
    </span>
  );
}

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ClientStatus } from '@/store/types';

const STATUS_CONFIG: Record<ClientStatus, { label: string; cls: string }> = {
  active: {
    label: 'Active',
    cls: 'border-pine-teal-600 text-pine-teal-700 dark:border-pine-teal-400 dark:text-pine-teal-300',
  },
  inactive: {
    label: 'Inactive',
    cls: 'border-silver-400 text-muted-foreground dark:border-white/20',
  },
  suspended: {
    label: 'Suspended',
    cls: 'border-rose-400 text-rose-600 dark:border-rose-400 dark:text-rose-400',
  },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const { label, cls } = STATUS_CONFIG[status];
  return (
    <Badge className={cn('bg-transparent font-medium', cls)}>{label}</Badge>
  );
}

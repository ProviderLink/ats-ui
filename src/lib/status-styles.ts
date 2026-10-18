import type { EmailStatus } from '@/store/types';

export const EMAIL_STATUS_STYLES: Record<
  EmailStatus,
  { label: string; dot: string; cls: string }
> = {
  delivered: {
    label: 'Delivered',
    dot: 'bg-emerald-500',
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  received: {
    label: 'Received',
    dot: 'bg-blue-500',
    cls: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-400',
  },
  sent: {
    label: 'Sent',
    dot: 'bg-muted-foreground',
    cls: 'border-border bg-muted text-muted-foreground',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-amber-500',
    cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-400',
  },
  failed: {
    label: 'Failed',
    dot: 'bg-destructive',
    cls: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
  delayed: {
    label: 'Delayed',
    dot: 'bg-orange-500',
    cls: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/60 dark:text-orange-400',
  },
  bounced: {
    label: 'Bounced',
    dot: 'bg-red-500',
    cls: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/60 dark:text-red-400',
  },
  complained: {
    label: 'Complained',
    dot: 'bg-red-600',
    cls: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/60 dark:text-red-400',
  },
};

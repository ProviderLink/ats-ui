import type { EmailStatus, JobStatus } from '@/store/types';

export const EMAIL_STATUS_STYLES: Record<
  EmailStatus,
  { label: string; dot: string; cls: string }
> = {
  delivered: {
    label: 'Delivered',
    dot: 'bg-emerald-500',
    cls: 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  received: {
    label: 'Received',
    dot: 'bg-blue-500',
    cls: 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-400',
  },
  sent: {
    label: 'Sent',
    dot: 'bg-muted-foreground',
    cls: 'border-gray-300 bg-gray-100 text-gray-700 dark:border-border dark:bg-muted dark:text-muted-foreground',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-amber-500',
    cls: 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-400',
  },
  failed: {
    label: 'Failed',
    dot: 'bg-destructive',
    cls: 'border-red-300 bg-red-100 text-red-700 dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive',
  },
  delayed: {
    label: 'Delayed',
    dot: 'bg-orange-500',
    cls: 'border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800/60 dark:bg-orange-950/60 dark:text-orange-400',
  },
  bounced: {
    label: 'Bounced',
    dot: 'bg-red-500',
    cls: 'border-red-300 bg-red-100 text-red-800 dark:border-red-800/60 dark:bg-red-950/60 dark:text-red-400',
  },
  complained: {
    label: 'Complained',
    dot: 'bg-red-600',
    cls: 'border-red-300 bg-red-100 text-red-800 dark:border-red-800/60 dark:bg-red-950/60 dark:text-red-400',
  },
};

export const JOB_STATUS_VARIANT: Record<
  JobStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  open: 'default',
  draft: 'secondary',
  on_hold: 'outline',
  closed: 'destructive',
};

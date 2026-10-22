import type { ClientStatus, CrmHealth, NoteMethod } from '@/store/types';
import {
  CalendarIcon,
  MailIcon,
  MessageSquareIcon,
  PencilIcon,
  PhoneCallIcon,
} from 'lucide-react';
import React from 'react';

export const statusConfig: Record<
  ClientStatus,
  { label: string; cls: string; dot: string }
> = {
  active: {
    label: 'Active',
    dot: 'bg-[#69c58a]',
    cls: 'border-[#2d8a51]/30 bg-[#2d8a51]/10 text-[#24703f] dark:border-[#69c58a]/30 dark:bg-[#69c58a]/10 dark:text-[#69c58a]',
  },
  inactive: {
    label: 'Inactive',
    dot: 'bg-silver-400 dark:bg-white/30',
    cls: 'border-border bg-muted text-muted-foreground',
  },
  suspended: {
    label: 'Suspended',
    dot: 'bg-rose-500 dark:bg-rose-400',
    cls: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:text-rose-400',
  },
};

export const healthConfig: Record<
  CrmHealth,
  { label: string; dot: string; cls: string }
> = {
  green: {
    label: 'Healthy',
    dot: 'bg-[#69c58a]',
    cls: 'text-[#2d8a51] dark:text-[#69c58a]',
  },
  yellow: {
    label: 'At Risk',
    dot: 'bg-[#f3a64a]',
    cls: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    label: 'Critical',
    dot: 'bg-rose-500 dark:bg-rose-400',
    cls: 'text-rose-600 dark:text-rose-400',
  },
};

export const jobStatusConfig: Record<string, { label: string; cls: string }> = {
  open: {
    label: 'Open',
    cls: 'border-pine-teal-600/50 text-pine-teal-700 dark:border-pine-teal-400/50 dark:text-pine-teal-300',
  },
  draft: { label: 'Draft', cls: 'border-silver-400/50 text-muted-foreground' },
  on_hold: {
    label: 'On Hold',
    cls: 'border-amber-500/50 text-amber-600 dark:text-amber-400',
  },
  closed: {
    label: 'Closed',
    cls: 'border-rose-400/50 text-rose-600 dark:text-rose-400',
  },
};

export const noteMethodConfig: Record<
  NoteMethod,
  { label: string; icon: React.ReactNode }
> = {
  call: { label: 'Call', icon: <PhoneCallIcon className="size-3.5" /> },
  email: { label: 'Email', icon: <MailIcon className="size-3.5" /> },
  meeting: { label: 'Meeting', icon: <CalendarIcon className="size-3.5" /> },
  message: {
    label: 'Message',
    icon: <MessageSquareIcon className="size-3.5" />,
  },
  other: { label: 'Other', icon: <PencilIcon className="size-3.5" /> },
};

export function nameInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

import type { ClientStatus, CrmHealth, NoteMethod } from '@/store/types';
import {
  CalendarIcon,
  MailIcon,
  MessageSquareIcon,
  PencilIcon,
  PhoneCallIcon,
} from 'lucide-react';
import React from 'react';

const AVATAR_BG = [
  'bg-pine-teal-100 text-pine-teal-800 dark:bg-pine-teal-900 dark:text-pine-teal-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
];

export const statusConfig: Record<
  ClientStatus,
  { label: string; cls: string; dot: string }
> = {
  active: {
    label: 'Active',
    dot: 'bg-[#69c58a]',
    cls: 'border-[#69c58a]/60 text-[#2d8a51] dark:text-[#69c58a]',
  },
  inactive: {
    label: 'Inactive',
    dot: 'bg-silver-400 dark:bg-white/30',
    cls: 'border-silver-400/60 text-muted-foreground',
  },
  suspended: {
    label: 'Suspended',
    dot: 'bg-rose-500 dark:bg-rose-400',
    cls: 'border-rose-400/60 text-rose-600 dark:text-rose-400',
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

export function avatarColor(name: string) {
  return AVATAR_BG[name.charCodeAt(0) % AVATAR_BG.length];
}

export function nameInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

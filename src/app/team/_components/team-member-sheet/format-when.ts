import { timeAgo } from '@/lib/utils';

/** "Oct 19, 2026, 3:42 PM" in the viewer's timezone. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Relative text for recent times, empty once `timeAgo` falls back to a date. */
export function relativeWhen(value: string | null | undefined): string {
  const text = timeAgo(value);
  return /ago$|^just now$/.test(text) ? text : '';
}

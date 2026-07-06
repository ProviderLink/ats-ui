import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;
const MONTH = 2592000;

export function timeAgo(value: string | null | undefined): string {
  if (!value) return '';
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 0) return 'just now';
  if (seconds < MINUTE) return 'just now';
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)}m ago`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)}h ago`;
  if (seconds < WEEK) {
    const d = Math.floor(seconds / DAY);
    return d === 1 ? '1 day ago' : `${d} days ago`;
  }
  if (seconds < MONTH) {
    const w = Math.floor(seconds / WEEK);
    return w === 1 ? '1 week ago' : `${w} weeks ago`;
  }
  return formatDate(value);
}

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export function isValidObjectId(id: string | undefined | null): boolean {
  return typeof id === 'string' && OBJECT_ID_RE.test(id);
}

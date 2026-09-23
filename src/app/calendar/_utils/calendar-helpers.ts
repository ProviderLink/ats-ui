import { getZonedDate, getZonedTime, isValidTimezone } from '@/lib/timezones';
import { DEFAULT_TIMEZONE } from '@/lib/timezones';
import type { Interview } from '@/store/types';

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calendar day an interview falls on, in the zone it was scheduled in.
 *
 * `timezone` is optional so existing callers keep compiling, but it SHOULD be
 * passed: `scheduledAt` is a UTC instant, so slicing it put a 23:00-UTC
 * interview on the wrong day for anyone east of UTC.
 */
export function getInterviewDate(
  scheduledAt: string,
  timezone?: string | null
): string {
  return getZonedDate(scheduledAt, timezone);
}

/** Wall-clock start time in the interview's own timezone. */
export function getInterviewStartTime(
  scheduledAt: string,
  timezone?: string | null
): string {
  return getZonedTime(scheduledAt, timezone);
}

/**
 * Wall-clock end time in the interview's own timezone.
 *
 * Derives from the same `getZonedTime` as the start rather than adding minutes
 * to UTC fields, so a 23:30 start plus 60 minutes correctly reads 00:30 instead
 * of mixing zones.
 */
export function getInterviewEndTime(
  scheduledAt: string,
  duration: number,
  timezone?: string | null
): string {
  const start = new Date(scheduledAt);
  if (Number.isNaN(start.getTime())) return '';
  const end = new Date(start.getTime() + duration * 60_000);
  return getZonedTime(end.toISOString(), timezone);
}

/**
 * Long-form date label in the interview's own timezone, so the date shown next
 * to a time never belongs to a different day than that time.
 */
export function formatScheduledAt(
  scheduledAt: string,
  timezone?: string | null
): string {
  const date = new Date(scheduledAt);
  const tz = timezone && isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(isValidTimezone(tz) ? { timeZone: tz } : {}),
  });
}

export function formatDateLabel(dateStr: string): {
  primary: string;
  secondary: string;
} {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
  return { primary: weekday, secondary: monthDay };
}

export function getMeetingLocation(interview: Interview): string | null {
  const m = interview.meetingDetails;
  if (!m) return null;
  if (m.link) return m.link;
  if (m.phoneNumber) return m.phoneNumber;
  if (m.address) return m.address;
  return null;
}

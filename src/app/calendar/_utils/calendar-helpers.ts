import {
  DEFAULT_TIMEZONE,
  getZonedDate,
  getZonedTime,
  isValidTimezone,
} from '@/lib/timezones';
import type { CalendarEvent, ExternalMeeting } from '@/store/types';

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calendar day an interview falls on, in the zone it was scheduled in.
 * `scheduledAt` is a UTC instant, so always pass `timezone`: slicing it put a
 * 23:00-UTC interview on the wrong day for anyone east of UTC.
 */
export function getInterviewDate(
  scheduledAt: string,
  timezone?: string | null
): string {
  return getZonedDate(scheduledAt, timezone);
}

export function getInterviewStartTime(
  scheduledAt: string,
  timezone?: string | null
): string {
  return getZonedTime(scheduledAt, timezone);
}

/**
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

/** Rendered in the interview's own timezone so the date never disagrees with the time shown beside it. */
export function formatScheduledAt(
  scheduledAt: string,
  timezone?: string | null
): string {
  const date = new Date(scheduledAt);
  const tz =
    timezone && isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
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

export function isExternalMeeting(e: CalendarEvent): e is ExternalMeeting {
  return 'kind' in e && e.kind === 'external';
}

export function getMeetingLocation(interview: CalendarEvent): string | null {
  const m = interview.meetingDetails;
  if (!m) return null;
  if (m.link) return m.link;
  if (m.phoneNumber) return m.phoneNumber;
  if (m.address) return m.address;
  return null;
}

export function sortByStartTime<T extends CalendarEvent>(events: T[]): T[] {
  return [...events].sort((a, b) =>
    getInterviewStartTime(a.scheduledAt, a.timezone).localeCompare(
      getInterviewStartTime(b.scheduledAt, b.timezone)
    )
  );
}

export function getEventsOnDate(events: CalendarEvent[], isoDate: string) {
  return sortByStartTime(
    events.filter(e => getInterviewDate(e.scheduledAt, e.timezone) === isoDate)
  );
}

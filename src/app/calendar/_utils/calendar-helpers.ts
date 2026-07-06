import type { Interview } from '@/store/types';

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getInterviewDate(scheduledAt: string): string {
  return scheduledAt.slice(0, 10);
}

export function getInterviewStartTime(scheduledAt: string): string {
  return scheduledAt.slice(11, 16);
}

export function getInterviewEndTime(
  scheduledAt: string,
  duration: number
): string {
  const d = new Date(scheduledAt);
  d.setMinutes(d.getMinutes() + duration);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export function formatScheduledAt(scheduledAt: string): string {
  const date = new Date(scheduledAt);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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

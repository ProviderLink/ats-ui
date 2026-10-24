import type { ExternalMeetingStatus, ExternalMeetingType } from '@/store/types';

/**
 * Look of external meetings. Interviews use solid tinted chips; external
 * meetings use a DASHED teal outline plus an "External" marker so they read as
 * "someone outside the ATS" at a glance, in every calendar view.
 */
export const EXTERNAL_MEETING_CHIP =
  'border-dashed bg-teal-100 text-teal-900 border-teal-500 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/50';

export const EXTERNAL_MEETING_ACCENT = 'bg-teal-500';

export const EXTERNAL_MEETING_BADGE =
  'border-dashed border-teal-500 bg-teal-100 text-teal-900 dark:border-teal-500/50 dark:bg-teal-500/10 dark:text-teal-300';

export const EXTERNAL_MEETING_TYPE_LABELS: Record<ExternalMeetingType, string> =
  {
    video: 'Video Call',
    phone_call: 'Phone Call',
    in_person: 'In Person',
  };

export const EXTERNAL_MEETING_STATUS_LABELS: Record<
  ExternalMeetingStatus,
  string
> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const EXTERNAL_MEETING_STATUS_STYLES: Record<
  ExternalMeetingStatus,
  string
> = {
  scheduled:
    'bg-teal-100 text-teal-800 border-teal-500 dark:bg-transparent dark:text-teal-300 dark:border-teal-500/40',
  completed:
    'bg-green-100 text-green-800 border-green-400 dark:bg-transparent dark:text-green-400 dark:border-green-500/30',
  cancelled:
    'bg-red-100 text-red-700 border-red-300 dark:bg-transparent dark:text-destructive dark:border-destructive/30',
};

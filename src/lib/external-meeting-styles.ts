import type { ExternalMeetingStatus, ExternalMeetingType } from '@/store/types';

/**
 * Look of external meetings. Interviews use solid tinted chips; external
 * meetings use a DASHED teal outline plus an "External" marker so they read as
 * "someone outside the ATS" at a glance, in every calendar view.
 */
export const EXTERNAL_MEETING_CHIP =
  'border-dashed bg-teal-500/10 text-teal-800 border-teal-500/50 dark:text-teal-300';

export const EXTERNAL_MEETING_ACCENT = 'bg-teal-500';

export const EXTERNAL_MEETING_BADGE =
  'border-dashed border-teal-500/50 bg-teal-500/10 text-teal-800 dark:text-teal-300';

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
  scheduled: 'text-teal-700 border-teal-500/40 dark:text-teal-300',
  completed: 'text-green-600 border-green-500/30 dark:text-green-400',
  cancelled: 'text-destructive border-destructive/30',
};

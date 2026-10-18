import type { ScheduleInterviewInput } from '@/components/schedule-interview/schedule-interview-types';
import { zonedWallClockToUtc } from '@/lib/timezones';
import type { Interview, MeetingDetails } from '@/store/types';

type ResolvedSchedule =
  | { error: string }
  | {
      error?: undefined;
      type: Interview['type'];
      scheduledAt: string;
      meetingDetails: MeetingDetails;
    };

export function resolveScheduleInput(
  data: ScheduleInterviewInput,
  timezone: string
): ResolvedSchedule {
  if (data.type === 'google_meet' && !data.meetingLink.trim()) {
    return { error: 'Meeting link is required for Google Meet interviews' };
  }
  const scheduledAt = zonedWallClockToUtc(
    data.scheduledAt.slice(0, 10),
    data.scheduledAt.slice(11, 16),
    timezone
  );
  if (!scheduledAt) return { error: 'Please enter a valid date and time' };

  return {
    type: data.type as Interview['type'],
    scheduledAt,
    meetingDetails: {
      link: data.meetingLink || null,
      phoneNumber: data.phoneNumber || null,
      address: data.address || null,
    },
  };
}

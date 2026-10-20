import type { Interview } from './interview.types';

export type ExternalMeetingType = 'video' | 'phone_call' | 'in_person';
export type ExternalMeetingStatus = 'scheduled' | 'completed' | 'cancelled';

export interface ExternalMeetingDetails {
  link: string | null;
  phoneNumber: string | null;
  address: string | null;
}

/**
 * A meeting with someone who is NOT in the ATS. Standalone on purpose: it has
 * no candidate, application or job reference, so it never appears in candidate
 * lists, job pipelines, reports or the activity timeline.
 */
export interface ExternalMeeting {
  _id: string;
  /** Discriminator that tells these apart from interviews on the calendar. */
  kind: 'external';
  title: string;
  personName: string;
  personEmail: string | null;
  personPhone: string | null;
  /** Free-text label only ("Other" or a job title). Never a reference. */
  jobLabel: string | null;
  type: ExternalMeetingType;
  status: ExternalMeetingStatus;
  scheduledAt: string;
  /** Minutes: 10, 15, 30 or 60. */
  duration: number;
  /** Company timezone at booking time. */
  timezone: string;
  meetingDetails: ExternalMeetingDetails;
  notes: string | null;
  attendeeIds: string[];
  attendeeNames?: string[];
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExternalMeetingDto {
  title: string;
  personName: string;
  personEmail?: string | null;
  personPhone?: string | null;
  jobLabel?: string | null;
  type: ExternalMeetingType;
  scheduledAt: string;
  duration?: number;
  attendeeIds?: string[];
  meetingDetails?: Partial<ExternalMeetingDetails>;
  notes?: string | null;
}

export interface UpdateExternalMeetingDto extends Partial<
  Omit<CreateExternalMeetingDto, 'type'>
> {
  type?: ExternalMeetingType;
  status?: 'scheduled' | 'completed';
}

/** Anything the calendar can draw. */
export type CalendarEvent = Interview | ExternalMeeting;

export interface ExternalMeetingFilters {
  status?: ExternalMeetingStatus;
  page?: number;
  limit?: number;
}

import type {
  InterviewRecommendation,
  InterviewStatus,
  InterviewType,
} from './enums';

export interface MeetingDetails {
  link?: string | null;
  meetingId?: string;
  password?: string;
  phoneNumber?: string | null;
  address?: string | null;
}

export interface InterviewFeedback {
  _id: string;
  interviewerId: string;
  rating: number;
  notes: string;
  recommendation: InterviewRecommendation;
  submittedAt: string;
}

export interface Interview {
  _id: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  clientId: string;
  title: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt: string;
  /**
   * Minutes. Chosen in the schedule form on create (default 60), immutable
   * afterwards; used to compute the interview's end time.
   */
  duration: number;
  /**
   * Server-managed: always the company timezone from Settings. Read here so the
   * calendar and detail views can render the wall clock in the zone the
   * interview was booked under.
   */
  timezone: string;
  meetingDetails?: MeetingDetails | null;
  interviewerIds: string[];
  /**
   * Display names for `interviewerIds`, resolved by the backend.
   *
   * Optional: older records and deleted users have no name, in which case the
   * UI falls back to the raw id for that slot.
   */
  interviewerNames?: string[];
  feedbacks: InterviewFeedback[];
  organizerId: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterviewDto {
  applicationId: string;
  candidateId: string;
  jobId: string;
  clientId: string;
  title: string;
  type: InterviewType;
  scheduledAt: string;
  /** Minutes: 10, 15, 30 or 60. Backend defaults to 60 when omitted. */
  duration?: number;
  interviewerIds: string[];
  meetingDetails?: MeetingDetails;
}

/** Fields needed when creating an interview via the nested application route.
 *  applicationId, candidateId, jobId, clientId are derived by the backend. */
export interface CreateNestedInterviewDto {
  title: string;
  type: InterviewType;
  jobId?: string;
  scheduledAt: string;
  /** Minutes: 10, 15, 30 or 60. Backend defaults to 60 when omitted. */
  duration?: number;
  interviewerIds: string[];
  meetingDetails?: MeetingDetails;
}

export interface UpdateInterviewDto {
  title?: string;
  scheduledAt?: string;
  interviewerIds?: string[];
  meetingDetails?: MeetingDetails;
  status?: InterviewStatus;
  type?: InterviewType;
}

export interface CreateFeedbackDto {
  rating: number;
  notes: string;
  recommendation: InterviewRecommendation;
}

export interface InterviewFilters {
  candidateId?: string;
  jobId?: string;
  applicationId?: string;
  status?: InterviewStatus;
  interviewerId?: string;
  page?: number;
  limit?: number;
}

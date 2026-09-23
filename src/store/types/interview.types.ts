import type {
  InterviewMeetingType,
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
  interviewType: InterviewMeetingType;
  round: number;
  status: InterviewStatus;
  scheduledAt: string;
  duration: number;
  timezone: string;
  meetingDetails?: MeetingDetails | null;
  interviewerIds: string[];
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
  interviewType?: InterviewMeetingType;
  round: number;
  scheduledAt: string;
  duration: number;
  timezone: string;
  interviewerIds: string[];
  meetingDetails?: MeetingDetails;
}

/** Fields needed when creating an interview via the nested application route.
 *  applicationId, candidateId, jobId, clientId are derived by the backend. */
export interface CreateNestedInterviewDto {
  title: string;
  type: InterviewType;
  interviewType?: InterviewMeetingType;
  jobId?: string;
  round: number;
  scheduledAt: string;
  duration: number;
  timezone: string;
  interviewerIds: string[];
  meetingDetails?: MeetingDetails;
}

export interface UpdateInterviewDto {
  title?: string;
  scheduledAt?: string;
  duration?: number;
  timezone?: string;
  interviewerIds?: string[];
  meetingDetails?: MeetingDetails;
  status?: InterviewStatus;
  /**
   * Sent by the calendar edit form but NOT yet accepted by the backend's
   * `updateInterviewSchema`, so zod currently strips both. Declared here so the
   * payload is typed; the form renders them read-only until the schema allows
   * them (see `event-sheet.tsx`).
   */
  type?: InterviewType;
  round?: number;
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

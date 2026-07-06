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

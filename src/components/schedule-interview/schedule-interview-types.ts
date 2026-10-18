export interface ScheduleInterviewInput {
  title: string;
  type: string;
  jobId: string;
  scheduledAt: string;
  /** Minutes. */
  duration: number;
  interviewerIds: string[];
  meetingLink: string;
  phoneNumber: string;
  address: string;
}

export interface ScheduleCandidateOption {
  _id: string;
  firstName: string;
  lastName: string;
}

/** Pre-filled values for the edit flow. Dates are wall clocks in company TZ. */
export interface ScheduleInterviewInitial {
  title: string;
  type: string;
  jobId?: string;
  date: string;
  time: string;
  /** Not editable in edit mode; shown read-only. */
  duration?: number;
  meetingLink: string;
  phoneNumber: string;
  address: string;
  interviewerIds: string[];
}

export type ScheduleInterviewMode = 'create' | 'edit';

export const DURATION_OPTIONS = [10, 15, 30, 60] as const;
export const DEFAULT_DURATION = 60;

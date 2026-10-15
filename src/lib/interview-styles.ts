import type {
  InterviewRecommendation,
  InterviewStatus,
  InterviewType,
} from '@/store/types';

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  phone_call: 'Phone Call',
  in_person: 'In Person',
};

export const INTERVIEW_TYPE_STYLES: Record<InterviewType, string> = {
  zoom: 'bg-primary/10 text-primary border-primary/20',
  google_meet:
    'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400',
  phone_call:
    'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  in_person:
    'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400',
};

export const INTERVIEW_TYPE_ACCENTS: Record<InterviewType, string> = {
  zoom: 'bg-primary',
  google_meet: 'bg-green-500',
  phone_call: 'bg-amber-500',
  in_person: 'bg-violet-500',
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const INTERVIEW_STATUS_STYLES: Record<InterviewStatus, string> = {
  scheduled: 'text-primary border-primary/30',
  completed: 'text-green-600 border-green-500/30 dark:text-green-400',
  cancelled: 'text-destructive border-destructive/30',
  no_show: 'text-orange-600 border-orange-500/30 dark:text-orange-400',
};

export const RECOMMENDATION_LABELS: Record<InterviewRecommendation, string> = {
  strong_yes: 'Strong Yes',
  yes: 'Yes',
  neutral: 'Neutral',
  no: 'No',
  strong_no: 'Strong No',
};

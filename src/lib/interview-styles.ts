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
  zoom: 'bg-primary/20 text-primary border-primary/50 dark:bg-primary/10 dark:border-primary/20',
  google_meet:
    'bg-green-100 text-green-800 border-green-400 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
  phone_call:
    'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  in_person:
    'bg-violet-100 text-violet-800 border-violet-400 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
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
  scheduled:
    'bg-primary/10 text-primary border-primary/50 dark:bg-transparent dark:border-primary/30',
  completed:
    'bg-green-100 text-green-800 border-green-400 dark:bg-transparent dark:text-green-400 dark:border-green-500/30',
  cancelled:
    'bg-red-100 text-red-700 border-red-300 dark:bg-transparent dark:text-destructive dark:border-destructive/30',
  no_show:
    'bg-orange-100 text-orange-800 border-orange-400 dark:bg-transparent dark:text-orange-400 dark:border-orange-500/30',
};

export const RECOMMENDATION_LABELS: Record<InterviewRecommendation, string> = {
  strong_yes: 'Strong Yes',
  yes: 'Yes',
  neutral: 'Neutral',
  no: 'No',
  strong_no: 'Strong No',
};

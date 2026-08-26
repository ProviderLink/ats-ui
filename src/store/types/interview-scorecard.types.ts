// NOTE: standalone module — intentionally NOT exported from
// `@/store/types/index.ts` (per the integration decision §5-C4: do not edit
// the shared barrel). Import directly from this file:
//   import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';

export const EXPERIENCE_SELECTIONS = [
  'relevant_job_experience',
  'understanding_of_position',
  'applicable_software_experience',
  'work_setting_bpo_call_center',
  'work_setting_healthcare_provider',
  'work_setting_insurance_company',
  'work_setting_other_us_client',
  'work_setting_other',
] as const;
export type ExperienceSelection = (typeof EXPERIENCE_SELECTIONS)[number];

export const FINAL_RECOMMENDATIONS = [
  'strongly_recommend',
  'recommend',
  'recommend_with_concerns',
  'hold_for_another_position',
  'do_not_recommend',
] as const;
export type FinalRecommendation = (typeof FINAL_RECOMMENDATIONS)[number];

export const INTERVIEW_SCORECARD_TYPES = ['initial_screening'] as const;
export type InterviewScorecardType = (typeof INTERVIEW_SCORECARD_TYPES)[number];

export const CATEGORY_WEIGHTS = {
  communication: 30,
  experience: 25,
  professionalism: 15,
  technology: 20,
  availability: 10,
} as const;

// Human-readable labels for the multi-select checklist (UI only).
export const EXPERIENCE_SELECTION_LABELS: Record<ExperienceSelection, string> =
  {
    relevant_job_experience: 'Relevant job experience',
    understanding_of_position: 'Understanding of position',
    applicable_software_experience: 'Applicable software experience',
    work_setting_bpo_call_center: 'Work setting: BPO / Call center',
    work_setting_healthcare_provider: 'Work setting: Healthcare provider',
    work_setting_insurance_company: 'Work setting: Insurance company',
    work_setting_other_us_client: 'Work setting: Other US client',
    work_setting_other: 'Work setting: Other',
  };

export const FINAL_RECOMMENDATION_LABELS: Record<FinalRecommendation, string> =
  {
    strongly_recommend: 'Strongly Recommend',
    recommend: 'Recommend',
    recommend_with_concerns: 'Recommend with Concerns',
    hold_for_another_position: 'Hold for Another Position',
    do_not_recommend: 'Do Not Recommend',
  };

// UI chip color tokens — chosen to match the interview-status badge pattern
// in candidate-detail-sheet.tsx (border + bg + text per state).
export const FINAL_RECOMMENDATION_BADGE_CLASS: Record<
  FinalRecommendation,
  string
> = {
  strongly_recommend:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300',
  recommend:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300',
  recommend_with_concerns:
    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300',
  hold_for_another_position:
    'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-300',
  do_not_recommend: 'border-destructive/40 bg-destructive/5 text-destructive',
};

export interface InterviewScorecard {
  _id: string;
  candidateId: string;
  jobId: string;
  interviewerId: string;

  interviewDate: string; // ISO
  interviewType: InterviewScorecardType;

  // Category 1
  commEnglishDiction: number;
  commEnglishComprehension: number;
  communicationRating: number;
  // Category 2
  experienceSelections: ExperienceSelection[];
  experienceRating: number;
  // Category 3
  profPreparedOnTime: boolean;
  profAppearanceDemeanor: boolean;
  profAttitudeReliability: boolean;
  profInterestInPosition: boolean;
  professionalismRating: number;
  // Category 4
  techInternetSpeed: boolean;
  techHeadsetNoiseCancelling: boolean;
  techTwoScreens: boolean;
  techBackupInternet: boolean;
  techBackupGenerator: boolean;
  technologyRating: number;
  // Category 5
  availUsHours: boolean;
  availCompensationAcceptable: boolean;
  availStartAvailability: boolean;
  availOverallFit: boolean;
  availabilityRating: number;

  // Server-computed weighted scores (read-only on the client; server is source of truth)
  communicationWeighted: number;
  experienceWeighted: number;
  professionalismWeighted: number;
  technologyWeighted: number;
  availabilityWeighted: number;
  overallScore: number;

  // Notes
  strengths: string;
  concerns: string;
  generalNotes: string;
  recommendedPosition: string;
  earliestStartDate: string | null; // ISO
  compensationExpectation: string;

  finalRecommendation: FinalRecommendation;

  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Shape POSTed to the backend. Server-computed fields are NEVER sent.
export interface CreateInterviewScorecardDto {
  candidateId: string;
  jobId: string;
  interviewerId?: string;
  interviewDate: string; // ISO datetime
  interviewType?: InterviewScorecardType;
  commEnglishDiction: number;
  commEnglishComprehension: number;
  experienceSelections: ExperienceSelection[];
  experienceRating: number;
  profPreparedOnTime: boolean;
  profAppearanceDemeanor: boolean;
  profAttitudeReliability: boolean;
  profInterestInPosition: boolean;
  professionalismRating: number;
  techInternetSpeed: boolean;
  techHeadsetNoiseCancelling: boolean;
  techTwoScreens: boolean;
  techBackupInternet: boolean;
  techBackupGenerator: boolean;
  technologyRating: number;
  availUsHours: boolean;
  availCompensationAcceptable: boolean;
  availStartAvailability: boolean;
  availOverallFit: boolean;
  availabilityRating: number;
  strengths?: string;
  concerns?: string;
  generalNotes?: string;
  recommendedPosition?: string;
  earliestStartDate?: string | null;
  compensationExpectation?: string;
  finalRecommendation: FinalRecommendation;
}

// Shape PATCHed to the backend when editing. Immutable identifiers
// (candidateId, jobId) are excluded — they never change after creation.
export type UpdateInterviewScorecardDto = Omit<
  CreateInterviewScorecardDto,
  'candidateId' | 'jobId'
>;

export interface InterviewScorecardListResponse {
  data: InterviewScorecard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Pure UX preview — mirrors the server's computeScores formula precisely.
 * Used in the form for live score preview ONLY. The server recomputes on
 * save and is the source of truth — these client-side numbers are never
 * submitted.
 */
export function computeScorecardPreview(input: {
  commEnglishDiction: number;
  commEnglishComprehension: number;
  experienceRating: number;
  professionalismRating: number;
  technologyRating: number;
  availabilityRating: number;
}): {
  communicationRating: number;
  communicationWeighted: number;
  experienceWeighted: number;
  professionalismWeighted: number;
  technologyWeighted: number;
  availabilityWeighted: number;
  overallScore: number;
} {
  const communicationRating = Math.round(
    (input.commEnglishDiction + input.commEnglishComprehension) / 2
  );
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const communicationWeighted = round1(
    (communicationRating / 5) * CATEGORY_WEIGHTS.communication
  );
  const experienceWeighted = round1(
    (input.experienceRating / 5) * CATEGORY_WEIGHTS.experience
  );
  const professionalismWeighted = round1(
    (input.professionalismRating / 5) * CATEGORY_WEIGHTS.professionalism
  );
  const technologyWeighted = round1(
    (input.technologyRating / 5) * CATEGORY_WEIGHTS.technology
  );
  const availabilityWeighted = round1(
    (input.availabilityRating / 5) * CATEGORY_WEIGHTS.availability
  );
  const overallScore = round1(
    communicationWeighted +
      experienceWeighted +
      professionalismWeighted +
      technologyWeighted +
      availabilityWeighted
  );
  return {
    communicationRating,
    communicationWeighted,
    experienceWeighted,
    professionalismWeighted,
    technologyWeighted,
    availabilityWeighted,
    overallScore,
  };
}

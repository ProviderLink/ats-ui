import type {
  ExperienceSelection,
  FinalRecommendation,
  InterviewScorecard,
  InterviewScorecardType,
} from '@/store/types/interview-scorecard.types';
import {
  EXPERIENCE_SELECTIONS,
  FINAL_RECOMMENDATIONS,
} from '@/store/types/interview-scorecard.types';
import type { DefaultValues } from 'react-hook-form';
import { z } from 'zod';

const ratingField = z.number().int().min(1).max(5);

export const scorecardSchema = z.object({
  jobId: z.string().min(1, 'Job is required'),
  interviewerId: z.string().min(1, 'Interviewer is required'),
  interviewDate: z.string().min(1, 'Interview date is required'),
  commEnglishDiction: ratingField,
  commEnglishComprehension: ratingField,
  experienceSelections: z.array(z.enum(EXPERIENCE_SELECTIONS)).default([]),
  experienceRating: ratingField,
  profPreparedOnTime: z.boolean(),
  profAppearanceDemeanor: z.boolean(),
  profAttitudeReliability: z.boolean(),
  profInterestInPosition: z.boolean(),
  professionalismRating: ratingField,
  techInternetSpeed: z.boolean(),
  techHeadsetNoiseCancelling: z.boolean(),
  techTwoScreens: z.boolean(),
  techBackupInternet: z.boolean(),
  techBackupGenerator: z.boolean(),
  technologyRating: ratingField,
  availUsHours: z.boolean(),
  availCompensationAcceptable: z.boolean(),
  availStartAvailability: z.boolean(),
  availOverallFit: z.boolean(),
  availabilityRating: ratingField,
  strengths: z.string().optional().default(''),
  concerns: z.string().optional().default(''),
  generalNotes: z.string().optional().default(''),
  recommendedPosition: z.string().optional().default(''),
  earliestStartDate: z.string().optional().nullable().default(null),
  compensationExpectation: z.string().optional().default(''),
  finalRecommendation: z.enum(FINAL_RECOMMENDATIONS, {
    message: 'Final recommendation is required',
  }),
});

export type ScorecardFormValues = z.input<typeof scorecardSchema>;

export const RECOMMENDATION_OPTIONS: FinalRecommendation[] = [
  'strongly_recommend',
  'recommend',
  'recommend_with_concerns',
  'hold_for_another_position',
  'do_not_recommend',
];

/**
 * Format a Date/ISO value for an `<input type="datetime-local">` in the
 * user's LOCAL timezone. A naive `toISOString().slice(0, 16)` would render
 * UTC, which on a later save gets re-interpreted as local time and silently
 * shifts the stored date by the timezone offset.
 */
export function toDatetimeLocal(value: string | Date): string {
  const d = new Date(value);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** `finalRecommendation` is deliberately omitted so submit raises its required error. */
export function defaultScorecardValues(
  jobId: string,
  interviewerId: string
): DefaultValues<ScorecardFormValues> {
  return {
    jobId,
    interviewerId,
    interviewDate: toDatetimeLocal(new Date()),
    commEnglishDiction: 0,
    commEnglishComprehension: 0,
    experienceSelections: [],
    experienceRating: 0,
    profPreparedOnTime: false,
    profAppearanceDemeanor: false,
    profAttitudeReliability: false,
    profInterestInPosition: false,
    professionalismRating: 0,
    techInternetSpeed: false,
    techHeadsetNoiseCancelling: false,
    techTwoScreens: false,
    techBackupInternet: false,
    techBackupGenerator: false,
    technologyRating: 0,
    availUsHours: false,
    availCompensationAcceptable: false,
    availStartAvailability: false,
    availOverallFit: false,
    availabilityRating: 0,
    strengths: '',
    concerns: '',
    generalNotes: '',
    recommendedPosition: '',
    earliestStartDate: '',
    compensationExpectation: '',
  };
}

export function toFormValues(sc: InterviewScorecard): ScorecardFormValues {
  return {
    jobId: sc.jobId,
    interviewerId: sc.interviewerId,
    interviewDate: toDatetimeLocal(sc.interviewDate),
    commEnglishDiction: sc.commEnglishDiction,
    commEnglishComprehension: sc.commEnglishComprehension,
    experienceSelections: sc.experienceSelections,
    experienceRating: sc.experienceRating,
    profPreparedOnTime: sc.profPreparedOnTime,
    profAppearanceDemeanor: sc.profAppearanceDemeanor,
    profAttitudeReliability: sc.profAttitudeReliability,
    profInterestInPosition: sc.profInterestInPosition,
    professionalismRating: sc.professionalismRating,
    techInternetSpeed: sc.techInternetSpeed,
    techHeadsetNoiseCancelling: sc.techHeadsetNoiseCancelling,
    techTwoScreens: sc.techTwoScreens,
    techBackupInternet: sc.techBackupInternet,
    techBackupGenerator: sc.techBackupGenerator,
    technologyRating: sc.technologyRating,
    availUsHours: sc.availUsHours,
    availCompensationAcceptable: sc.availCompensationAcceptable,
    availStartAvailability: sc.availStartAvailability,
    availOverallFit: sc.availOverallFit,
    availabilityRating: sc.availabilityRating,
    strengths: sc.strengths ?? '',
    concerns: sc.concerns ?? '',
    generalNotes: sc.generalNotes ?? '',
    recommendedPosition: sc.recommendedPosition ?? '',
    earliestStartDate: sc.earliestStartDate
      ? new Date(sc.earliestStartDate).toISOString().slice(0, 10)
      : '',
    compensationExpectation: sc.compensationExpectation ?? '',
    finalRecommendation: sc.finalRecommendation,
  };
}

/** Fields shared by the create and update payloads. */
export function buildScorecardFields(values: ScorecardFormValues) {
  return {
    interviewDate: new Date(values.interviewDate).toISOString(),
    interviewType: 'initial_screening' as InterviewScorecardType,
    commEnglishDiction: Number(values.commEnglishDiction),
    commEnglishComprehension: Number(values.commEnglishComprehension),
    experienceSelections:
      (values.experienceSelections as ExperienceSelection[]) ?? [],
    experienceRating: Number(values.experienceRating),
    profPreparedOnTime: !!values.profPreparedOnTime,
    profAppearanceDemeanor: !!values.profAppearanceDemeanor,
    profAttitudeReliability: !!values.profAttitudeReliability,
    profInterestInPosition: !!values.profInterestInPosition,
    professionalismRating: Number(values.professionalismRating),
    techInternetSpeed: !!values.techInternetSpeed,
    techHeadsetNoiseCancelling: !!values.techHeadsetNoiseCancelling,
    techTwoScreens: !!values.techTwoScreens,
    techBackupInternet: !!values.techBackupInternet,
    techBackupGenerator: !!values.techBackupGenerator,
    technologyRating: Number(values.technologyRating),
    availUsHours: !!values.availUsHours,
    availCompensationAcceptable: !!values.availCompensationAcceptable,
    availStartAvailability: !!values.availStartAvailability,
    availOverallFit: !!values.availOverallFit,
    availabilityRating: Number(values.availabilityRating),
    strengths: values.strengths ?? '',
    concerns: values.concerns ?? '',
    generalNotes: values.generalNotes ?? '',
    recommendedPosition: values.recommendedPosition ?? '',
    earliestStartDate: values.earliestStartDate
      ? new Date(values.earliestStartDate).toISOString()
      : null,
    compensationExpectation: values.compensationExpectation ?? '',
    finalRecommendation: values.finalRecommendation,
  };
}

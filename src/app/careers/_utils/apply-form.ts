import type {
  CandidateParsedData,
  ParsedEducation,
  ParsedExperience,
} from '@/store/types';
import { z } from 'zod';

export interface ReviewData {
  summary: string;
  skills: string[];
  languages: string[];
  certifications: string[];
  experience: ParsedExperience[];
  education: ParsedEducation[];
}

export interface ResumeUploadResult {
  resumeOriginalName: string;
  resumeRawText: string;
  parsedData: CandidateParsedData | null;
}

export const applySchema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  email: z.string().min(1, 'Required').email('Invalid email'),
  phone: z.string().min(1, 'Required'),
  yearsOfExperience: z
    .number({ error: 'Enter a number' })
    .min(0, 'Must be 0 or more'),
  videoIntroUrl: z.string().min(1, 'Required').url('Must be a valid URL'),
  portfolioUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  englishProficiency: z.enum([
    'basic',
    'conversational',
    'professional',
    'fluent',
    'native',
  ]),
  currentSalaryPHP: z.number().min(0, 'Must be 0 or more').optional(),
  currentSalaryUSD: z.number().min(0, 'Must be 0 or more').optional(),
  reasonForLeaving: z.string().max(500).optional(),
  cityOfResidence: z.string().min(1, 'Required').max(100),
});

export type ApplyFormValues = z.infer<typeof applySchema>;

export const EMPTY_REVIEW: ReviewData = {
  summary: '',
  skills: [],
  languages: [],
  certifications: [],
  experience: [],
  education: [],
};

export function reviewFromParsed(
  parsed: CandidateParsedData | null
): ReviewData {
  return {
    summary: parsed?.summary ?? '',
    skills: parsed?.skills ?? [],
    languages: parsed?.languages ?? [],
    certifications: parsed?.certifications ?? [],
    experience: parsed?.experience ?? [],
    education: parsed?.education ?? [],
  };
}

export function applicantFormData(values: ApplyFormValues): FormData {
  const fd = new FormData();
  fd.append('firstName', values.firstName);
  fd.append('lastName', values.lastName);
  fd.append('email', values.email);
  fd.append('phone', values.phone);
  fd.append('yearsOfExperience', String(values.yearsOfExperience));
  if (values.englishProficiency)
    fd.append('englishProficiency', values.englishProficiency);
  if (values.currentSalaryPHP !== undefined)
    fd.append('currentSalaryPHP', String(values.currentSalaryPHP));
  if (values.currentSalaryUSD !== undefined)
    fd.append('currentSalaryUSD', String(values.currentSalaryUSD));
  if (values.reasonForLeaving)
    fd.append('reasonForLeaving', values.reasonForLeaving);
  if (values.cityOfResidence)
    fd.append('cityOfResidence', values.cityOfResidence);
  if (values.videoIntroUrl) {
    fd.append('videoIntroUrl', values.videoIntroUrl);
    fd.append('videoIntroSource', 'external');
  }
  if (values.portfolioUrl) fd.append('portfolioUrl', values.portfolioUrl);
  return fd;
}

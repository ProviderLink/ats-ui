import type {
  CandidateParsedData,
  ParsedEducation,
  ParsedExperience,
} from '@/store/types';

export interface ReviewData {
  summary: string;
  skills: string[];
  languages: string[];
  certifications: string[];
  experience: ParsedExperience[];
  education: ParsedEducation[];
}

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

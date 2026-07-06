import type {
  AiFitRecommendation,
  CandidateSource,
  CandidateStatus,
  EnglishProficiency,
  VideoIntroSource,
  WorkloadLevel,
} from './enums';
import type { RawTag } from './tag.types';

export interface ParsedExperience {
  company: string;
  title: string;
  duration: string;
  description: string;
}

export interface ParsedEducation {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export interface CandidateParsedData {
  summary?: string;
  yearsOfExperience?: number;
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  experience?: ParsedExperience[];
  education?: ParsedEducation[];
}

export interface CandidateAiValidation {
  isValid: boolean;
  score: number;
  reason: string;
  completedAt: string;
}

export interface CandidateAiScore {
  score: number;
  recommendation: AiFitRecommendation;
  summary?: string;
  strengths?: string[];
  concerns?: string[];
}

export interface CandidateCrmProfile {
  workloadLevel?: WorkloadLevel;
  satisfactionScore?: number | null;
  burnoutRiskFlag?: boolean;
  replacementRiskFlag?: boolean;
  lastVaCheckin?: string | null;
  notes?: string;
}

export interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string | null;
  resumeUrl: string;
  resumeOriginalName: string;
  resumeRawText?: string;
  videoIntroUrl?: string | null;
  videoIntroSource?: 'cloudinary' | 'external' | null;
  parsedData?: CandidateParsedData;
  aiValidation?: CandidateAiValidation | null;
  aiScore?: CandidateAiScore;
  appliedJobId?: string | null;
  yearsOfExperience: number;
  englishProficiency: EnglishProficiency | null;
  currentSalaryPHP: number | null;
  currentSalaryUSD: number | null;
  reasonForLeaving: string | null;
  cityOfResidence: string | null;
  source: CandidateSource;
  // Backend may return tags either populated (full Tag objects) or as a
  // raw `string[]` of tag ObjectIds — list endpoints in particular ship the
  // raw IDs. Resolve via `lib/tags.ts` `useResolvedTags` / `normalizeTags`
  // before reading `name`/`color` on a tag.
  tags: RawTag[];
  inTalentPool: boolean;
  talentPoolAddedAt?: string | null;
  talentPoolNotes?: string | null;
  status: CandidateStatus;
  crmProfile?: CandidateCrmProfile | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  videoIntroUrl?: string;
  videoIntroSource?: VideoIntroSource;
  yearsOfExperience?: number;
  tags?: string[];
  file: File;
}

export interface UpdateCandidateDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  videoIntroUrl?: string | null;
  videoIntroSource?: VideoIntroSource | null;
  yearsOfExperience?: number;
  tags?: string[];
  parsedData?: CandidateParsedData;
  englishProficiency?: EnglishProficiency | null;
  currentSalaryPHP?: number | null;
  currentSalaryUSD?: number | null;
  reasonForLeaving?: string | null;
  cityOfResidence?: string | null;
}

export interface CandidateFilters {
  status?: CandidateStatus;
  inTalentPool?: boolean;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

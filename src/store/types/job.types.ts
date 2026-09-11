import type { StageShape } from './common';
import type {
  ExperienceLevel,
  JobPriority,
  JobStatus,
  JobType,
  LocationType,
  SalaryPeriod,
} from './enums';
import type { RawTag } from './tag.types';

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: SalaryPeriod;
}

export interface JobPipeline {
  templateId?: string | null;
  stages: StageShape[];
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  clientId: string;
  status: JobStatus;
  jobType: JobType;
  locationType: LocationType;
  location?: string;
  experienceLevel: ExperienceLevel;
  priority: JobPriority;
  openings: number;
  requirements?: string[];
  responsibilities?: string[];
  skills?: string[];
  // Backend may return tags either populated (full Tag objects) or as a raw
  // `string[]` of tag ObjectIds — list endpoints in particular ship the raw
  // IDs. Resolve via `lib/tags.ts` (`useResolvedTags` / `normalizeTags`)
  // before reading `name`/`color` on a tag.
  tags: RawTag[];
  benefits?: string[];
  salaryRange?: SalaryRange | null;
  pipeline?: JobPipeline;
  applicationDeadline?: string | null;
  startDate?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobDto {
  title: string;
  description: string;
  clientId: string;
  pipelineId?: string;
  jobType: JobType;
  locationType: LocationType;
  location?: string;
  experienceLevel: ExperienceLevel;
  priority?: JobPriority;
  openings?: number;
  requirements?: string[];
  responsibilities?: string[];
  skills?: string[];
  tags?: string[];
  benefits?: string[];
  salaryRange?: SalaryRange | null;
  applicationDeadline?: string | null;
  startDate?: string | null;
}

export type UpdateJobDto = Partial<Omit<CreateJobDto, 'clientId'>>;

/**
 * Free-form brief sent to the AI draft generator. Purely a generation input —
 * it is never persisted on a job.
 */
export interface GenerateJobDraftDto {
  notes: string;
}

/**
 * Structured result of the AI draft generator. Only fields that exist on the
 * job form are returned, and enums are intentionally excluded so a guessed
 * value can never reach the form unnoticed.
 */
export interface GeneratedJobDraft {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  benefits: string[];
}

/**
 * Existing list content from the job form, sent for tidying. Only the list
 * fields are ever sent — enums, dates, salary and client stay untouched.
 */
export interface StandardizeJobContentDto {
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  benefits: string[];
}

/** Tidied copies of the submitted lists. Never persisted by the API call. */
export type StandardizedJobContent = StandardizeJobContentDto;

export interface JobFilters {
  clientId?: string;
  status?: JobStatus;
  search?: string;
  page?: number;
  limit?: number;
}

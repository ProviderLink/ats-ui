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

export interface JobFilters {
  clientId?: string;
  status?: JobStatus;
  search?: string;
  page?: number;
  limit?: number;
}

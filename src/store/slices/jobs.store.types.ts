import type {
  CreateJobDto,
  GenerateJobDraftDto,
  GeneratedJobDraft,
  Job,
  JobFilters,
  JobStatus,
  Pagination,
  StandardizeJobContentDto,
  StandardizedJobContent,
  UpdateJobDto,
} from '../types';

export interface JobState {
  items: Job[];
  detail: Record<string, Job>;
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: JobFilters;
}

export interface JobActions {
  fetch: (params?: JobFilters) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  create: (data: CreateJobDto) => Promise<Job>;
  update: (id: string, data: UpdateJobDto) => Promise<void>;
  /**
   * Turn a free-form brief into a structured draft. Stateless — nothing is
   * persisted and no job state is touched, so failed calls can never leave
   * the store inconsistent.
   */
  generateDraft: (data: GenerateJobDraftDto) => Promise<GeneratedJobDraft>;
  /**
   * Tidy and standardize the list fields of an existing job. Also stateless —
   * it returns cleaned copies of what was sent and persists nothing.
   */
  standardizeContent: (
    data: StandardizeJobContentDto
  ) => Promise<StandardizedJobContent>;
  remove: (id: string) => Promise<void>;
  setStatus: (id: string, status: JobStatus) => Promise<void>;
  setPipeline: (
    id: string,
    templateId: string,
    stageMapping?: Record<string, string>
  ) => Promise<void>;
  setFilters: (f: Partial<JobFilters>) => void;
  reset: () => void;
  _patch: (job: Job) => void;
  _remove: (id: string) => void;
  _removeByClientId: (clientId: string) => void;
}

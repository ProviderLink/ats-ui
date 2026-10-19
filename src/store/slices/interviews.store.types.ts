import type {
  CreateFeedbackDto,
  CreateInterviewDto,
  CreateNestedInterviewDto,
  Interview,
  InterviewFilters,
  Pagination,
  UpdateInterviewDto,
} from '../types';

export interface InterviewState {
  items: Interview[];
  detail: Record<string, Interview>;
  /**
   * Interviews scoped to one application, keyed by application id.
   *
   * Kept SEPARATE from `items` so a scoped read can never shrink the shared
   * list. `items` is the calendar's dataset; `byApplication[appId]` is what a
   * candidate detail sheet renders. See `fetchScopedByApplication`.
   */
  byApplication: Record<string, Interview[]>;
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: InterviewFilters;
}

export interface InterviewActions {
  fetch: (params?: InterviewFilters) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  refresh: (params?: InterviewFilters) => Promise<void>;
  fetchByApplication: (
    applicationId: string,
    params?: InterviewFilters
  ) => Promise<void>;
  /**
   * Read-only fetch for a scoped view: stores into `byApplication` only and
   * never touches `items`. Preferred over `fetchByApplication` for screens
   * that exist to show one application's interviews.
   */
  fetchScopedByApplication: (
    applicationId: string,
    params?: InterviewFilters
  ) => Promise<Interview[]>;
  create: (data: CreateInterviewDto) => Promise<Interview>;
  createForApplication: (
    applicationId: string,
    data: CreateNestedInterviewDto
  ) => Promise<Interview>;
  update: (
    id: string,
    data: UpdateInterviewDto,
    applicationId?: string
  ) => Promise<void>;
  cancel: (id: string, applicationId?: string) => Promise<void>;
  submitFeedback: (
    id: string,
    data: CreateFeedbackDto,
    applicationId?: string
  ) => Promise<void>;
  completeAndFeedback: (
    id: string,
    data: CreateFeedbackDto,
    applicationId?: string
  ) => Promise<void>;
  setFilters: (f: Partial<InterviewFilters>) => void;
  reset: () => void;
  _patch: (interview: Interview) => void;
  _remove: (id: string) => void;
  _removeByCandidateId: (candidateId: string) => void;
}

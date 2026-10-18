import type {
  Candidate,
  CandidateFilters,
  CreateCandidateDto,
  Pagination,
  UpdateCandidateDto,
} from '../types';

export interface CandidateState {
  items: Candidate[];
  detail: Record<string, Candidate>;
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: CandidateFilters;
  ineligibleItems: Candidate[];
  ineligibleLoaded: boolean;
  ineligibleLoading: boolean;
}

export interface CandidateActions {
  fetch: (params?: CandidateFilters) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  create: (data: CreateCandidateDto) => Promise<Candidate>;
  update: (id: string, data: UpdateCandidateDto) => Promise<void>;
  remove: (id: string) => Promise<void>;
  uploadAvatar: (id: string, file: File) => Promise<void>;
  updateTalentPool: (
    id: string,
    action: 'add' | 'remove',
    notes?: string
  ) => Promise<void>;
  assignJob: (
    id: string,
    jobId: string,
    startStageId?: string
  ) => Promise<void>;
  rejectCandidate: (
    id: string,
    payload: {
      rejectionReasonId: string;
      destination?: 'candidate_pool' | 'permanently_ineligible';
      internalNotes?: string;
    }
  ) => Promise<void>;
  changeJob: (
    id: string,
    payload: {
      applicationId: string;
      targetJobId: string;
      startStageId?: string;
    }
  ) => Promise<void>;
  /**
   * Restore a permanently ineligible candidate to In Review.
   *
   * Patches the returned candidate into the store rather than refetching a
   * filtered list — a `fetch({ status: 'pending' })` would replace `items`
   * with pending-only rows and the post-boot guard would then block any
   * recovery, emptying the In Pipeline tab.
   */
  restoreCandidate: (id: string, payload: { jobId: string }) => Promise<void>;
  approve: (
    id: string,
    jobId: string
  ) => Promise<{
    candidateId: string;
    jobId: string;
    applicationId: string;
    approved: boolean;
  }>;
  setFilters: (f: Partial<CandidateFilters>) => void;
  fetchIneligible: (force?: boolean) => Promise<void>;
  reset: () => void;
  _patch: (c: Candidate) => void;
  _remove: (id: string) => void;
}

import type { Application, ApplicationFilters, Pagination } from '../types';

export interface ApplicationState {
  items: Application[];
  detail: Record<string, Application>;
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: ApplicationFilters;
}

export interface ApplicationActions {
  fetch: (params?: ApplicationFilters) => Promise<void>;
  /**
   * Fetch applications matching a filter WITHOUT touching `items`.
   *
   * `items` holds the full post-boot dataset that several screens read
   * (`/ats/hired`, the In Pipeline tab, the clients table). Transient callers —
   * dialogs that need one job's or one client's applications — must use this
   * instead of `fetch`, otherwise they replace the shared list with a subset
   * and those screens silently render empty.
   */
  fetchScoped: (params: ApplicationFilters) => Promise<Application[]>;
  /**
   * Fetch matching applications and UNION them into `items` by id.
   *
   * Used by sheets that need a scoped slice (one client's applications) while
   * still showing rows the shared list already holds. Never removes anything,
   * so it cannot blank out screens that depend on the full dataset.
   */
  fetchScopedMerge: (params: ApplicationFilters) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  approve: (id: string) => Promise<void>;
  moveStage: (id: string, stageId: string) => Promise<void>;
  hire: (id: string) => Promise<void>;
  reject: (
    id: string,
    payload?: {
      reason?: string;
      rejectionReasonId?: string;
      destination?: 'candidate_pool' | 'permanently_ineligible';
      internalNotes?: string;
    }
  ) => Promise<void>;
  /**
   * Remove the candidate from this job and park them in the Talent Pool.
   * Not a rejection — no reason is needed and nothing is recorded as one.
   */
  moveToTalentPool: (id: string, notes?: string) => Promise<void>;
  updateNotes: (id: string, notes: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setFilters: (f: Partial<ApplicationFilters>) => void;
  reset: () => void;
  _patch: (app: Application) => void;
  _remove: (id: string) => void;
  _removeByJobId: (jobId: string) => void;
  _removeByCandidateId: (candidateId: string) => void;
  _removeByClientId: (clientId: string) => void;
}

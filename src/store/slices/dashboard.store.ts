import { getJson } from '@/lib/api-client';
import {
  buildApplicationsTrend,
  buildCandidateStatusBreakdown,
  buildInterviewStatusBreakdown,
  buildJobStatusBreakdown,
  buildKpi,
  buildPipelineStages,
  buildTopJobs,
  buildTrend,
} from '@/lib/dashboard-metrics';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { socketManager } from '../realtime/socket';
import type {
  Application,
  Candidate,
  CandidateStatusBreakdownItem,
  Client,
  DashboardSnapshot,
  Interview,
  InterviewStatusBreakdownItem,
  Job,
  JobStatusBreakdownItem,
  KpiSummary,
  PipelineStageItem,
  TopJobItem,
  TrendDayPoint,
  TrendPoint,
} from '../types';

interface DashboardState {
  loading: boolean;
  isRefreshing: boolean;
  error: string | null;
  /** True while the dashboard page is mounted — gates socket-driven refetches. */
  isActive: boolean;

  clients: Client[];
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  interviews: Interview[];
  snapshot: DashboardSnapshot | null;

  kpi: KpiSummary | null;
  trend: TrendPoint[];
  applicationsTrend: TrendDayPoint[];
  topJobs: TopJobItem[];
  candidateStatuses: CandidateStatusBreakdownItem[];
  jobStatuses: JobStatusBreakdownItem[];
  interviewStatuses: InterviewStatusBreakdownItem[];
  pipelineStages: PipelineStageItem[];
}

interface DashboardActions {
  fetch: () => Promise<void>;
  reset: () => void;
  setActive: (active: boolean) => void;
}

const initialState: DashboardState = {
  loading: false,
  isRefreshing: false,
  error: null,
  isActive: false,
  clients: [],
  jobs: [],
  candidates: [],
  applications: [],
  interviews: [],
  snapshot: null,
  kpi: null,
  trend: [],
  applicationsTrend: [],
  topJobs: [],
  candidateStatuses: [],
  jobStatuses: [],
  interviewStatuses: [],
  pipelineStages: [],
};

const HUGE_LIMIT = 9999;

// The dashboard used to persist its derived KPI summary + `lastLoadedAt` under
// `ats-analytics`, which is what made a previous session's numbers flash on
// first paint before the live fetch resolved. That persist middleware is gone,
// so the old payload is now orphaned — it is unreferenced and would linger
// forever for anyone who does not log out (`resetSessionScopedStores` only runs
// on logout/401). One guarded purge drops the stale, cross-user residue.
try {
  localStorage.removeItem('ats-analytics');
} catch {
  // Storage unavailable (private mode / quota) — nothing to purge.
}


/** Fetch a list endpoint that may return either a bare array or paged shape. */
async function fetchList<T>(
  path: string,
  params: Record<string, unknown>
): Promise<T[]> {
  const res = await getJson<T[] | { data: T[] }>(path, params);
  return Array.isArray(res) ? res : (res.data ?? []);
}

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  immer((set, get) => {
    // Monotonic token identifying the newest in-flight fetch. Responses from
    // an earlier request are discarded when they land after a newer one, so
    // rapid refresh / socket-driven cycles can never paint stale aggregates
    // over fresh ones.
    let fetchSeq = 0;

    // Register a socket invalidator so any ATS entity change (created /
    // updated / deleted for candidates, applications, jobs, clients,
    // interviews, plus the domain status-change events) triggers an
    // immediate background refresh of all dashboard data.
    socketManager.registerInvalidator(() => {
      const s = get();
      // Only refresh while the dashboard is actually on screen, and skip if
      // a fetch is already in flight.
      if (s.isActive && !s.loading && !s.isRefreshing) s.fetch();
    });

    return {
      ...initialState,

      setActive: active => {
        set(s => {
          s.isActive = active;
        });
      },

      fetch: async () => {
        if (get().loading || get().isRefreshing) return;
        const hasData = get().kpi !== null;
        // Capture this run's identity BEFORE any await so we can tell whether
        // a newer fetch has superseded us by the time the responses arrive.
        const seq = ++fetchSeq;
        set(s => {
          if (hasData) s.isRefreshing = true;
          else s.loading = true;
          s.error = null;
        });

        try {
          // Kick off the dashboard snapshot and every list endpoint in parallel.
          // Each list uses a very large limit so the client can compute accurate
          // breakdowns (counts, trend, conversions) without paginating.
          const [
            snapshotRes,
            clients,
            jobs,
            candidates,
            applications,
            interviews,
          ] = await Promise.all([
            getJson<DashboardSnapshot>('/ats/dashboard').catch(() => null),
            fetchList<Client>('/ats/clients', { page: 1, limit: HUGE_LIMIT }),
            fetchList<Job>('/ats/jobs', { page: 1, limit: HUGE_LIMIT }),
            fetchList<Candidate>('/ats/candidates', {
              page: 1,
              limit: HUGE_LIMIT,
            }),
            fetchList<Application>('/ats/applications', {
              page: 1,
              limit: HUGE_LIMIT,
            }),
            fetchList<Interview>('/ats/interviews', {
              page: 1,
              limit: HUGE_LIMIT,
            }),
          ]);

          const snapshot = snapshotRes ?? null;

          // A newer fetch finished (or started and is still in flight) while
          // this one was waiting — its payload is authoritative.
          if (seq !== fetchSeq) return;

          set(s => {
            s.clients = clients;
            s.jobs = jobs;
            s.candidates = candidates;
            s.applications = applications;
            s.interviews = interviews;
            s.snapshot = snapshot;
            s.kpi = buildKpi(
              snapshot,
              clients,
              jobs,
              candidates,
              applications,
              interviews
            );
            s.trend = buildTrend(applications);
            s.applicationsTrend = buildApplicationsTrend(applications, 180);
            s.topJobs = buildTopJobs(applications, jobs, clients);
            s.candidateStatuses = buildCandidateStatusBreakdown(candidates);
            s.jobStatuses = buildJobStatusBreakdown(jobs);
            s.interviewStatuses = buildInterviewStatusBreakdown(interviews);
            s.pipelineStages = buildPipelineStages(applications);
            s.loading = false;
            s.isRefreshing = false;
          });
        } catch (e) {
          if (seq !== fetchSeq) return;
          set(s => {
            s.loading = false;
            s.isRefreshing = false;
            s.error = (e as Error).message;
          });
        }
      },

      reset: () => set(() => ({ ...initialState })),
    };
  })
);

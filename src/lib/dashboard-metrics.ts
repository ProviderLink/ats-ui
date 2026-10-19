import type {
  CandidateStatusBreakdownItem,
  DashApplication,
  DashCandidate,
  DashClient,
  DashInterview,
  DashJob,
  DashboardSnapshot,
  InterviewStatus,
  InterviewStatusBreakdownItem,
  JobStatus,
  JobStatusBreakdownItem,
  KpiSummary,
  LifecycleStage,
  PipelineStageItem,
  TopJobItem,
  TrendDayPoint,
  TrendPoint,
} from '@/store/types';

// Label / colour maps — kept in one place so UI and derivation stay in sync.

const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  active: 'Active',
  hired: 'Hired',
  // Backend may still return legacy values; only surface them if present.
  idle: 'Inactive',
};

const CANDIDATE_STATUS_COLORS: Record<string, string> = {
  pending: '#94a3b8',
  approved: 'var(--primary)',
  active: 'var(--primary)',
  hired: 'var(--success)',
  idle: 'var(--muted-foreground)',
};

const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  on_hold: 'On Hold',
  closed: 'Closed',
};

const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  open: 'var(--primary)',
  draft: '#94a3b8',
  on_hold: 'var(--warning)',
  closed: 'var(--destructive)',
};

const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const INTERVIEW_STATUS_COLORS: Record<InterviewStatus, string> = {
  scheduled: 'var(--primary)',
  completed: 'var(--success)',
  cancelled: 'var(--warning)',
  no_show: 'var(--destructive)',
};

// Stable display order for the pipeline lifecycle
const PIPELINE_ORDER: LifecycleStage[] = [
  'pending',
  'approved',
  'hired',
  'rejected',
];

const PIPELINE_LABELS: Record<LifecycleStage, string> = {
  pending: 'Applied / Pending',
  approved: 'In Pipeline',
  hired: 'Hired',
  rejected: 'Rejected',
};

const PIPELINE_COLORS: Record<LifecycleStage, string> = {
  pending: 'var(--muted-foreground)',
  approved: 'var(--primary)',
  hired: 'var(--success)',
  rejected: 'var(--destructive)',
};

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Normalise the historical `in_pipeline` value to the UI enum `approved`. */
function normalizePhase(phase: string): LifecycleStage {
  if (phase === 'in_pipeline') return 'approved';
  if (
    phase === 'pending' ||
    phase === 'approved' ||
    phase === 'hired' ||
    phase === 'rejected'
  ) {
    return phase as LifecycleStage;
  }
  return 'pending';
}

/**
 * Build the "Top Jobs by Applications" leaderboard — jobs ranked by the number
 * of applications they have attracted, with hires shown alongside. Only jobs
 * that actually have applications appear (avoids a long tail of empty rows).
 */
export function buildTopJobs(
  applications: DashApplication[],
  jobs: DashJob[],
  clients: DashClient[]
): TopJobItem[] {
  const jobMap = new Map(jobs.map(j => [j._id, j]));
  const clientMap = new Map(clients.map(c => [c._id, c]));

  const counts = new Map<string, { applications: number; hired: number }>();

  for (const app of applications) {
    const entry = counts.get(app.jobId) ?? { applications: 0, hired: 0 };
    entry.applications += 1;
    if (app.phase === 'hired') entry.hired += 1;
    counts.set(app.jobId, entry);
  }

  return Array.from(counts.entries())
    .map(([jobId, stats]) => {
      const job = jobMap.get(jobId);
      const client = job ? clientMap.get(job.clientId) : undefined;
      return {
        jobId,
        title: job?.title ?? 'Untitled job',
        clientName: client?.companyName ?? null,
        applications: stats.applications,
        hired: stats.hired,
      };
    })
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 6);
}

export function buildCandidateStatusBreakdown(
  candidates: DashCandidate[]
): CandidateStatusBreakdownItem[] {
  const counts = new Map<string, number>();
  for (const c of candidates) {
    const status = c.status ?? 'pending';
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([status, count]) => ({
      status,
      label: CANDIDATE_STATUS_LABELS[status] ?? status,
      count,
      fill: CANDIDATE_STATUS_COLORS[status] ?? 'var(--muted-foreground)',
    }))
    .sort((a, b) => b.count - a.count);
}

export function buildJobStatusBreakdown(jobs: DashJob[]): JobStatusBreakdownItem[] {
  const counts = new Map<JobStatus, number>();
  for (const j of jobs) {
    counts.set(j.status, (counts.get(j.status) ?? 0) + 1);
  }
  return (Object.keys(JOB_STATUS_LABELS) as JobStatus[])
    .map(status => ({
      status,
      label: JOB_STATUS_LABELS[status],
      count: counts.get(status) ?? 0,
      fill: JOB_STATUS_COLORS[status],
    }))
    .filter(item => item.count > 0);
}

export function buildInterviewStatusBreakdown(
  interviews: DashInterview[]
): InterviewStatusBreakdownItem[] {
  const counts = new Map<InterviewStatus, number>();
  for (const i of interviews) {
    counts.set(i.status, (counts.get(i.status) ?? 0) + 1);
  }
  return (Object.keys(INTERVIEW_STATUS_LABELS) as InterviewStatus[])
    .map(status => ({
      status,
      label: INTERVIEW_STATUS_LABELS[status],
      count: counts.get(status) ?? 0,
      fill: INTERVIEW_STATUS_COLORS[status],
    }))
    .filter(item => item.count > 0);
}

/**
 * Build a 3-month trailing trend of applications received, bucketed by
 * `appliedAt` timestamps. Real timestamps from the API drive every datapoint
 * — if there is no activity in a month it shows 0.
 */
export function buildTrend(applications: DashApplication[]): TrendPoint[] {
  const now = new Date();
  const buckets: TrendPoint[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      month: MONTH_SHORT[d.getMonth()],
      applications: 0,
    });
  }

  const startWindow = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  for (const app of applications) {
    if (!app.appliedAt) continue;
    const applied = new Date(app.appliedAt);
    if (Number.isNaN(applied.getTime()) || applied < startWindow) continue;
    const idx =
      (applied.getFullYear() - startWindow.getFullYear()) * 12 +
      (applied.getMonth() - startWindow.getMonth());
    if (idx >= 0 && idx < buckets.length) buckets[idx].applications += 1;
  }
  return buckets;
}

/**
 * Format a Date as `YYYY-MM-DD` in the user's **local** timezone. We must NOT
 * use `toISOString()` here because every chart point is keyed by calendar
 * date — `toISOString()` shifts days by up to ~24h in non-UTC timezones,
 * which made applications appear on the wrong day and inflated/deflated
 * neighbouring buckets. See the trend chart "inaccurate data" report.
 */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Build a daily series of applications over the last `days` days, split into
 * two stacks to mirror the dashboard "Total Visitors" area chart:
 *   - directApply — applications submitted directly via the public apply form
 *   - other       — internal uploads and recruiter assignments
 * Each point is keyed by `YYYY-MM-DD` (local timezone) so the chart's XAxis
 * tickFormatter can pretty-print it. Real `appliedAt` timestamps drive every
 * datapoint.
 */
export function buildApplicationsTrend(
  applications: DashApplication[],
  days = 90
): TrendDayPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const buckets: TrendDayPoint[] = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    buckets.push({ date: localDateKey(d), directApply: 0, other: 0 });
  }

  const index = new Map(buckets.map((b, i) => [b.date, i]));

  for (const app of applications) {
    // Treat invalid / missing timestamps as "not applicable" so they never
    // drift into the wrong day bucket.
    const ts = app.appliedAt;
    if (!ts) continue;
    const applied = new Date(ts);
    if (Number.isNaN(applied.getTime())) continue;
    applied.setHours(0, 0, 0, 0);
    const key = localDateKey(applied);
    const i = index.get(key);
    if (i === undefined) continue; // outside the window
    if (app.source === 'direct_apply') buckets[i].directApply += 1;
    else buckets[i].other += 1;
  }
  return buckets;
}

/**
 * Build a real pipeline-lifecycle view: number of applications that reached
 * each lifecycle stage, with drop-off and conversion relative to the
 * previous *forward* stage (pending → approved → hired). `rejected` is shown
 * for transparency but excluded from the conversion chain.
 */
export function buildPipelineStages(applications: DashApplication[]): PipelineStageItem[] {
  const counts = new Map<LifecycleStage, number>();
  counts.set('pending', 0);
  counts.set('approved', 0);
  counts.set('hired', 0);
  counts.set('rejected', 0);

  for (const app of applications) {
    const stage = normalizePhase(app.phase);
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }

  const total = applications.length || 1;
  const forwardOrder: LifecycleStage[] = ['pending', 'approved', 'hired'];
  const prevCount = (index: number): number =>
    index === 0 ? total : (counts.get(forwardOrder[index - 1]) ?? 0);

  return PIPELINE_ORDER.map(stage => {
    const count = counts.get(stage) ?? 0;
    const forwardIndex = forwardOrder.indexOf(stage);
    const prev = forwardIndex === -1 ? total : prevCount(forwardIndex);
    const dropOff = Math.max(prev - count, 0);
    const conversion = prev > 0 ? Math.round((count / prev) * 100) : 0;
    return {
      stage,
      label: PIPELINE_LABELS[stage],
      count,
      fill: PIPELINE_COLORS[stage],
      dropOff,
      conversion,
    };
  });
}

/**
 * Use the snapshot value if present, otherwise fall back to the locally-
 * derived count. The /ats/dashboard endpoint is confirmed to return live
 * data on every request — no caching — so its values are authoritative.
 * The fallback only applies when the snapshot request itself fails entirely.
 */
const fromSnap = (snap: number | undefined, derived: number): number =>
  typeof snap === 'number' ? snap : derived;

export function buildKpi(
  snap: DashboardSnapshot | null,
  clients: DashClient[],
  jobs: DashJob[],
  candidates: DashCandidate[],
  applications: DashApplication[],
  interviews: DashInterview[]
): KpiSummary {
  const ov = snap?.overview ?? null;
  const openJobs = jobs.filter(j => j.status === 'open').length;
  const scheduledInterviews = interviews.filter(
    i => i.status === 'scheduled'
  ).length;
  const completedInterviews = interviews.filter(
    i => i.status === 'completed'
  ).length;
  const hiredCount = applications.filter(a => a.phase === 'hired').length;
  const activeCandidates = candidates.filter(
    c =>
      (c.status as string) === 'approved' || (c.status as string) === 'active'
  ).length;

  return {
    totalClients: fromSnap(ov?.totalClients, clients.length),
    totalJobs: fromSnap(ov?.totalJobs, jobs.length),
    openJobs: fromSnap(ov?.openJobs, openJobs),
    totalCandidates: fromSnap(ov?.totalCandidates, candidates.length),
    totalApplications: fromSnap(ov?.totalApplications, applications.length),
    totalInterviews: fromSnap(ov?.totalInterviews, interviews.length),
    scheduledInterviews: fromSnap(ov?.scheduledInterviews, scheduledInterviews),
    completedInterviews: fromSnap(ov?.completedInterviews, completedInterviews),
    hiredCount: fromSnap(ov?.hiredCount, hiredCount),
    activeCandidates: fromSnap(ov?.activeCandidates, activeCandidates),
  };
}

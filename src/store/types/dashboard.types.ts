import type { InterviewStatus, JobStatus } from './enums';

/**
 * Raw shape returned by GET /ats/dashboard. The endpoint nests the aggregate
 * stats under `overview` (alongside recentApplications / upcomingInterviews /
 * jobStats). Every field is optional — we use whatever the backend ships and
 * fall back to values derived from the list endpoints for anything missing.
 */
export interface DashboardSnapshot {
  overview?: {
    totalCandidates?: number;
    approvedCandidates?: number;
    hiredCandidates?: number;
    totalJobs?: number;
    openJobs?: number;
    totalClients?: number;
    activeClients?: number;
    totalApplications?: number;
    pendingApplications?: number;
    approvedApplications?: number;
    hiredCount?: number;
    activeCandidates?: number;
    totalInterviews?: number;
    scheduledInterviews?: number;
    completedInterviews?: number;
  };
  recentApplications?: unknown[];
  upcomingInterviews?: unknown[];
  jobStats?: unknown[];
}

export interface KpiSummary {
  totalClients: number;
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  totalApplications: number;
  totalInterviews: number;
  scheduledInterviews: number;
  completedInterviews: number;
  hiredCount: number;
  activeCandidates: number;
}

export interface TopJobItem {
  jobId: string;
  title: string;
  clientName: string | null;
  applications: number;
  hired: number;
}

export interface CandidateStatusBreakdownItem {
  status: string;
  label: string;
  count: number;
  fill: string;
}

export interface JobStatusBreakdownItem {
  status: JobStatus;
  label: string;
  count: number;
  fill: string;
}

export interface InterviewStatusBreakdownItem {
  status: InterviewStatus;
  label: string;
  count: number;
  fill: string;
}

export interface TrendPoint {
  month: string;
  applications: number;
}

/** Daily applications trend — mirrors the dashboard 'Total Visitors' chart shape. */
export interface TrendDayPoint {
  date: string;
  directApply: number;
  other: number;
}

export type LifecycleStage = 'pending' | 'approved' | 'hired' | 'rejected';

export interface PipelineStageItem {
  stage: LifecycleStage;
  label: string;
  count: number;
  fill: string;
  dropOff: number;
  conversion: number;
}

import type { Application } from './application.types';
import type { Candidate } from './candidate.types';
import type { Client } from './client.types';
import type { InterviewStatus, JobStatus } from './enums';
import type { Interview } from './interview.types';
import type { Job } from './job.types';

/**
 * The only fields the dashboard reads from each entity. The slim metrics
 * endpoint returns exactly these, so a field added here must also be added to
 * the backend projection (`atsDashboard.service.ts`).
 */
export type DashClient = Pick<Client, '_id' | 'createdAt' | 'companyName'>;
export type DashJob = Pick<Job, '_id' | 'status' | 'clientId' | 'createdAt' | 'title'>;
export type DashCandidate = Pick<Candidate, '_id' | 'status' | 'createdAt' | 'inTalentPool' | 'eligibilityStatus'>;
export type DashApplication = Pick<Application, '_id' | 'phase' | 'jobId' | 'candidateId' | 'appliedAt' | 'hiredAt' | 'source'>;
export type DashInterview = Pick<Interview, '_id' | 'status'>;


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

/** Response of GET /ats/dashboard/metrics. */
export interface DashboardMetrics {
  overview: NonNullable<DashboardSnapshot['overview']>;
  clients: DashClient[];
  jobs: DashJob[];
  candidates: DashCandidate[];
  applications: DashApplication[];
  interviews: DashInterview[];
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

import { useApplicationStore } from '@/store/slices/applications.store';
import { useJobStore } from '@/store/slices/jobs.store';
import type { Candidate } from '@/store/types';
import { useMemo } from 'react';

/** The candidate's applications and the ones the sheet's actions operate on. */
export function useCandidateApplications(candidate: Candidate | null) {
  const applications = useApplicationStore(s => s.items);
  const jobs = useJobStore(s => s.items);
  const candidateId = candidate?._id;

  const candidateApplications = useMemo(
    () => applications.filter(a => a.candidateId === candidateId),
    [applications, candidateId]
  );

  /**
   * Jobs the candidate already holds an application for. The
   * (candidateId, jobId) index is unique regardless of phase, so restoring or
   * assigning onto one of these would be rejected.
   */
  const heldJobIds = useMemo(
    () => new Set(candidateApplications.map(a => a.jobId)),
    [candidateApplications]
  );

  /** The single application still awaiting a decision (pending-tab actions). */
  const pendingApplication = useMemo(
    () => candidateApplications.find(a => a.phase === 'pending') ?? null,
    [candidateApplications]
  );

  /** Pipeline actions operate on the first approved application. */
  const activePipelineApp = useMemo(
    () => candidateApplications.find(a => a.phase === 'approved') ?? null,
    [candidateApplications]
  );

  /**
   * How many OTHER applications the candidate still has open, excluding the
   * one currently being acted on. When this is non-zero a reject must not ban
   * or pool them — that would silently destroy the other job's pipeline, so
   * the destination options are hidden.
   *
   * When there is no active pipeline application, the "current" one is the
   * first live application (the one the In Review reject will act on), so it is
   * excluded explicitly rather than by comparing against `undefined`.
   */
  const otherLiveApplicationCount = useMemo(() => {
    const live = candidateApplications.filter(
      a => a.phase === 'pending' || a.phase === 'approved'
    );
    const current = activePipelineApp ?? live[0];
    if (!current) return 0;
    return live.filter(a => a._id !== current._id).length;
  }, [candidateApplications, activePipelineApp]);

  const pipelineJob = useMemo(
    () =>
      activePipelineApp
        ? (jobs.find(j => j._id === activePipelineApp.jobId) ?? null)
        : null,
    [jobs, activePipelineApp]
  );

  return {
    candidateApplications,
    heldJobIds,
    pendingApplication,
    activePipelineApp,
    otherLiveApplicationCount,
    pipelineJob,
  };
}

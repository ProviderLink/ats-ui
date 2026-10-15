import type { Job } from '@/store/types';

interface Args {
  openJobs: { _id: string; title: string }[];
  jobs: Job[];
  /** Jobs the candidate already holds an application for, in any phase. */
  heldJobIds: Set<string>;
  mode: 'change' | 'add';
  currentJobId?: string;
}

/** Open jobs with their active stages, for the ChangeJobDialog picker. */
export function buildChangeJobOptions({
  openJobs,
  jobs,
  heldJobIds,
  mode,
  currentJobId,
}: Args) {
  return openJobs
    .filter(j =>
      // Any job the candidate already holds would be rejected with a 409
      // (the (candidateId, jobId) index is unique regardless of phase).
      // In `change` mode the current job stays listed so the dialog can
      // show it as the one being moved away from — it excludes it itself.
      mode === 'change'
        ? !heldJobIds.has(j._id) || j._id === currentJobId
        : !heldJobIds.has(j._id)
    )
    .map(j => ({
      ...j,
      stages: (jobs.find(x => x._id === j._id)?.pipeline?.stages ?? [])
        .filter(s => s.isActive !== false)
        .sort((a, b) => a.order - b.order)
        .map(s => ({ _id: s._id, name: s.name })),
    }));
}

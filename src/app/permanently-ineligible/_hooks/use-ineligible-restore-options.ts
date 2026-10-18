import { useRestoreJobOptions } from '@/hooks/use-restore-job-options';
import { useApplicationStore } from '@/store/slices/applications.store';
import type { Candidate } from '@/store/types';
import { useMemo } from 'react';

/** Open jobs for the restore picker, and the jobs the target can't be restored onto. */
export function useIneligibleRestoreOptions(restoreTarget: Candidate | null) {
  const openJobs = useRestoreJobOptions();
  const applications = useApplicationStore(s => s.items);

  // The (candidateId, jobId) index is unique regardless of phase, so restoring
  // onto a job the candidate already holds would block the approval that
  // follows — the dialog disables these rather than letting the user hit it.
  const blockedJobIds = useMemo(() => {
    if (!restoreTarget) return new Set<string>();
    return new Set(
      applications
        .filter(a => a.candidateId === restoreTarget._id)
        .map(a => a.jobId)
    );
  }, [applications, restoreTarget]);

  return { openJobs, blockedJobIds };
}

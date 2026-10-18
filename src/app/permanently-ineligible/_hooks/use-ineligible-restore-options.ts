import { useApplicationStore } from '@/store/slices/applications.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import type { Candidate } from '@/store/types';
import { useEffect, useMemo } from 'react';

/** Open jobs for the restore picker, and the jobs the target can't be restored onto. */
export function useIneligibleRestoreOptions(restoreTarget: Candidate | null) {
  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const applications = useApplicationStore(s => s.items);
  const clients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);

  useEffect(() => {
    if (jobs.length === 0) fetchJobs({ page: 1, limit: 9999 });
  }, [jobs.length, fetchJobs]);

  useEffect(() => {
    if (clients.length === 0) fetchClients({ page: 1, limit: 9999 });
  }, [clients.length, fetchClients]);

  const openJobs = useMemo(() => {
    const clientMap = new Map(clients.map(c => [c._id, c.companyName]));
    return jobs
      .filter(j => j.status === 'open')
      .map(j => ({
        _id: j._id,
        title: j.title,
        clientName: clientMap.get(j.clientId) ?? '',
      }));
  }, [jobs, clients]);

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

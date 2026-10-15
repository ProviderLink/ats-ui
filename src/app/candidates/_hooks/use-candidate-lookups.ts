import { useInterviewerOptions } from '@/hooks/use-interviewer-options';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useMemo } from 'react';

/** Job, client and interviewer lookups shared by the candidate detail sheet. */
export function useCandidateLookups() {
  const jobs = useJobStore(s => s.items);
  const clients = useClientStore(s => s.items);
  // Scoped to ATS staff — see `useInterviewerOptions`.
  const { interviewers } = useInterviewerOptions();

  const users = useMemo(
    () =>
      interviewers.map(u => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
      })),
    [interviewers]
  );

  const openJobs = useMemo(
    () =>
      jobs
        .filter(j => j.status === 'open')
        .map(j => ({ _id: j._id, title: j.title })),
    [jobs]
  );

  function getJobTitle(jobId: string) {
    return jobs.find(j => j._id === jobId)?.title ?? jobId;
  }

  function getClientName(clientId: string) {
    return clients.find(c => c._id === clientId)?.companyName ?? clientId;
  }

  return { jobs, clients, users, openJobs, getJobTitle, getClientName };
}

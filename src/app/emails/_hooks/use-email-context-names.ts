import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import type { Email } from '@/store/types';
import { useEffect } from 'react';

/**
 * Human-readable names for an email's candidate/job context. Reads the shared
 * stores first and fetches the candidate once if it isn't loaded; every name is
 * undefined until known so callers can fall back to a generic label.
 */
export function useEmailContextNames(email: Email) {
  const candidateId = email.context?.candidateId ?? null;
  const jobId = email.context?.jobId ?? null;

  const candidate = useCandidateStore(s =>
    candidateId
      ? (s.detail[candidateId] ??
        s.items.find(c => c._id === candidateId) ??
        null)
      : null,
  );
  const fetchOne = useCandidateStore(s => s.fetchOne);
  const job = useJobStore(s =>
    jobId
      ? (s.detail[jobId] ?? s.items.find(j => j._id === jobId) ?? null)
      : null,
  );
  const fetchJob = useJobStore(s => s.fetchOne);
  const clientName = useClientStore(s =>
    job ? s.items.find(c => c._id === job.clientId)?.companyName : undefined,
  );

  useEffect(() => {
    if (candidateId && !candidate) void fetchOne(candidateId, { silent: true });
  }, [candidateId, candidate, fetchOne]);

  useEffect(() => {
    if (jobId && !job) void fetchJob(jobId);
  }, [jobId, job, fetchJob]);

  return {
    candidateName: candidate
      ? `${candidate.firstName} ${candidate.lastName}`.trim()
      : undefined,
    jobLabel: job
      ? clientName
        ? `${job.title} (${clientName})`
        : job.title
      : undefined,
  };
}

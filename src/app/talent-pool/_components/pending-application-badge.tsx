import { useApplicationStore } from '@/store/slices/applications.store';
import { useJobStore } from '@/store/slices/jobs.store';

/**
 * "Applied to <job> · in review" for a pooled candidate who applied again.
 * The application waits in In Review; the pool is left as the team set it.
 */
export function PendingApplicationBadge({
  candidateId,
}: {
  candidateId: string;
}) {
  const jobId = useApplicationStore(
    s =>
      s.items.find(a => a.candidateId === candidateId && a.phase === 'pending')
        ?.jobId
  );
  const jobTitle = useJobStore(s =>
    jobId ? s.items.find(j => j._id === jobId)?.title : undefined
  );
  if (!jobId) return null;
  return (
    <span className="mt-1 inline-flex w-fit items-center rounded-full border border-amber-500/40 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
      Applied to {jobTitle ?? 'a job'} · in review
    </span>
  );
}

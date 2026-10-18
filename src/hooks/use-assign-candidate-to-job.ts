import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Candidate } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';

/** "Assign to job" flow for one candidate row; `refresh` reloads applications. */
export function useAssignCandidateToJob(refresh: () => Promise<unknown>) {
  const assignJob = useCandidateStore(s => s.assignJob);
  const [assignTarget, setAssignTarget] = useState<Candidate | null>(null);

  async function assign(jobId: string, startStageId?: string) {
    if (!assignTarget) return;
    try {
      await assignJob(assignTarget._id, jobId, startStageId);
      await refresh();
      toast.success(
        `${assignTarget.firstName} ${assignTarget.lastName} assigned to job`
      );
      setAssignTarget(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return { assignTarget, setAssignTarget, assign };
}

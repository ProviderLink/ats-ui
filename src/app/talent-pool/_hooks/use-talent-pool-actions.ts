import { logOptimisticActivity } from '@/lib/activity';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useTagStore } from '@/store/slices/tags.store';
import type { Candidate } from '@/store/types';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { withToast } from '@/lib/with-toast';

/** Data and mutations for one talent-pool candidate in the detail sheet. */
export function useTalentPoolActions(
  open: boolean,
  candidate: Candidate | null,
  onAssigned: () => void
) {
  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const updateCandidate = useCandidateStore(s => s.update);
  const assignJob = useCandidateStore(s => s.assignJob);
  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);
  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);

  useEffect(() => {
    if (open) void fetchTags();
  }, [open, fetchTags]);

  useEffect(() => {
    if (open && jobs.length === 0) fetchJobs({ page: 1, limit: 9999 });
  }, [open, jobs.length, fetchJobs]);

  const openJobs = useMemo(
    () =>
      jobs
        .filter(j => j.status === 'open')
        .map(j => ({
          _id: j._id,
          title: j.title,
          stages: (j.pipeline?.stages ?? [])
            .filter(s => s.isActive)
            .sort((a, b) => a.order - b.order)
            .map(s => ({ _id: s._id, name: s.name })),
        })),
    [jobs]
  );

  async function removeFromPool() {
    if (!candidate) return;
    try {
      await updateTalentPool(candidate._id, 'remove');
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'talent_pool_removed',
        `${candidate.firstName} ${candidate.lastName} removed from talent pool`
      );
      toast.success('Removed from Talent Pool');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function updateNotes(notes: string) {
    if (!candidate) return;
    try {
      await updateTalentPool(candidate._id, 'add', notes);
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'note_updated',
        `Talent pool notes updated for ${candidate.firstName} ${candidate.lastName}`
      );
      toast.success('Notes saved');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function updateTags(tagIds: string[]) {
    if (!candidate) return;
    try {
      await withToast('Candidate updated', () =>
        updateCandidate(candidate._id, { tags: tagIds })
      );
    } catch {
      // withToast already reported the failure.
    }
  }

  async function assignToJob(jobId: string, startStageId?: string) {
    if (!candidate) return;
    try {
      await assignJob(candidate._id, jobId, startStageId);
      logOptimisticActivity('candidate', candidate._id, 'created', `Applied to job`);
      toast.success('Assigned to job');
      onAssigned();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return { allTags, openJobs, removeFromPool, updateNotes, updateTags, assignToJob };
}

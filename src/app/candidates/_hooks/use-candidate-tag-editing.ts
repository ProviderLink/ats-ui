import { useCandidateStore } from '@/store/slices/candidates.store';
import { useTagStore } from '@/store/slices/tags.store';
import type { Candidate } from '@/store/types';
import { useEffect } from 'react';

export function useCandidateTagEditing(
  candidate: Candidate | null,
  open: boolean
) {
  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);
  const updateCandidate = useCandidateStore(s => s.update);

  useEffect(() => {
    if (open) void fetchTags();
  }, [open, fetchTags]);

  async function updateTags(tagIds: string[]) {
    if (!candidate) return;
    try {
      await updateCandidate(candidate._id, { tags: tagIds });
    } catch {
      // toast handled by store
    }
  }

  return { allTags, updateTags };
}

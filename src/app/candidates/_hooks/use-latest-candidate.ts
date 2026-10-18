import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Candidate } from '@/store/types';

/**
 * The store's current version of a candidate. The `candidate` prop is a
 * snapshot from when a sheet opened; `items` and `detail` stay current across
 * mutations, so saves show up immediately.
 */
export function useLatestCandidate(candidate: Candidate | null) {
  const current = useCandidateStore(s => {
    if (!candidate) return undefined;
    return (
      s.detail[candidate._id] ?? s.items.find(i => i._id === candidate._id)
    );
  });
  return current ?? candidate;
}

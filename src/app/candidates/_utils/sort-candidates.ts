import { sortableTime } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import type { CandidateSortOption } from './candidate-sort';

export function sortCandidates(
  candidates: Candidate[],
  sortBy: CandidateSortOption
): Candidate[] {
  return [...candidates].sort((a, b) => {
    const aTime = sortableTime(a.createdAt);
    const bTime = sortableTime(b.createdAt);
    const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
    const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
    const aScore = a.aiScore?.score ?? a.aiValidation?.score ?? -1;
    const bScore = b.aiScore?.score ?? b.aiValidation?.score ?? -1;
    switch (sortBy) {
      case 'newest':
        return bTime - aTime;
      case 'oldest':
        return aTime - bTime;
      case 'a_z':
        return aName.localeCompare(bName);
      case 'z_a':
        return bName.localeCompare(aName);
      case 'highest_score':
        return bScore !== aScore ? bScore - aScore : bTime - aTime;
      case 'lowest_score':
        return aScore !== bScore ? aScore - bScore : bTime - aTime;
    }
  });
}

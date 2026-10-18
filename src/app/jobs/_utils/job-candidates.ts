import type { Application, Candidate } from '@/store';
import type { ApplicationPhase, Tag } from '@/store/types';

export interface CandidatePair {
  candidate: Candidate;
  application: Application;
}

export type SortKey = 'default' | 'pending' | 'approved';

export const SORT_LABELS: Record<SortKey, string> = {
  default: 'Sort',
  pending: 'Pendings First',
  approved: 'In Pipeline First',
};

export const PHASE_FILTERS: { key: ApplicationPhase; label: string }[] = [
  { key: 'approved', label: 'In Pipeline' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' },
];

const PHASE_ORDER: Record<ApplicationPhase, number> = {
  pending: 0,
  approved: 1,
  hired: 2,
  rejected: 3,
};

// Deliberately not filtered by `job.status`: candidates stay assigned to a job
// while it is on hold or closed, and every one of them should be listed.
export function pairWithCandidates(
  applications: Application[],
  candidates: Candidate[]
): CandidatePair[] {
  const candById = new Map(candidates.map(c => [c._id, c]));
  return applications.flatMap(application => {
    const candidate = candById.get(application.candidateId);
    return candidate ? [{ application, candidate }] : [];
  });
}

export function countByPhase(
  pairs: CandidatePair[]
): Record<ApplicationPhase, number> {
  const counts: Record<ApplicationPhase, number> = {
    pending: 0,
    approved: 0,
    hired: 0,
    rejected: 0,
  };
  for (const { application } of pairs) counts[application.phase]++;
  return counts;
}

export function filterAndSortPairs(
  pairs: CandidatePair[],
  phase: ApplicationPhase,
  sortKey: SortKey
): CandidatePair[] {
  const filtered = pairs.filter(p => p.application.phase === phase);
  // Re-rank so the chosen phase sorts first; other phases keep their order.
  const ranks: Record<ApplicationPhase, number> =
    sortKey === 'default' ? PHASE_ORDER : { ...PHASE_ORDER, [sortKey]: -1 };
  return filtered.sort(
    (a, b) => ranks[a.application.phase] - ranks[b.application.phase]
  );
}

// The backend may ship `candidate.tags` as raw tag IDs (see lib/tags.ts), so
// resolve them against the shared tag store once, outside any `.map()`.
export function firstTagByCandidate(
  pairs: CandidatePair[],
  tags: Tag[]
): Map<string, Tag | null> {
  const byTagId = new Map(tags.map(t => [t._id, t]));
  const map = new Map<string, Tag | null>();
  for (const { candidate } of pairs) {
    const raw = candidate.tags?.[0];
    const resolved = raw
      ? typeof raw === 'string'
        ? (byTagId.get(raw) ?? null)
        : raw
      : null;
    map.set(candidate._id, resolved);
  }
  return map;
}

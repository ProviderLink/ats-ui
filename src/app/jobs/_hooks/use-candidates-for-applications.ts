import type { Application, Candidate } from '@/store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useEffect, useMemo, useState } from 'react';

/**
 * Candidates to pair with a job's applications. Reads the shared candidate
 * list and asks the server for only the candidates it does not hold yet.
 */
export function useCandidatesForApplications(applications: Application[]): {
  candidates: Candidate[];
  resolving: boolean;
} {
  const storeItems = useCandidateStore(s => s.items);
  const ensureByIds = useCandidateStore(s => s.ensureByIds);

  const missingIds = useMemo(() => {
    const known = new Set(storeItems.map(c => c._id));
    // A rejected application whose candidate is absent belongs to someone the
    // default list hides (permanently ineligible), so it is not a reason to
    // fetch.
    return applications
      .filter(a => a.phase !== 'rejected' && !known.has(a.candidateId))
      .map(a => a.candidateId);
  }, [applications, storeItems]);

  // Ids the server could not supply (deleted candidates) must not leave the
  // view "resolving" forever, so track which set has been attempted.
  const missingKey = missingIds.join(',');
  const [settledKey, setSettledKey] = useState('');
  useEffect(() => {
    if (!missingKey) return;
    let alive = true;
    void ensureByIds(missingKey.split(',')).finally(() => {
      if (alive) setSettledKey(missingKey);
    });
    return () => {
      alive = false;
    };
  }, [missingKey, ensureByIds]);

  return {
    candidates: storeItems,
    resolving: missingKey !== '' && settledKey !== missingKey,
  };
}

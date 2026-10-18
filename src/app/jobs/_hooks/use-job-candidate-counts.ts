import { getJson } from '@/lib/api-client';
import type { Application } from '@/store';
import { useEffect, useMemo, useState } from 'react';

// Deliberately NOT the shared application store: the job panel's Candidates
// tab refetches applications for the selected job, which would clobber the
// store and zero out every other card's count.
export function useJobCandidateCounts(): Map<string, number> {
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    let alive = true;
    void getJson<Application[] | { data: Application[] }>('/ats/applications', {
      limit: 9999,
    })
      .then(res => {
        if (!alive) return;
        setApplications(Array.isArray(res) ? res : (res.data ?? []));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    const map = new Map<string, number>();
    for (const a of applications) {
      map.set(a.jobId, (map.get(a.jobId) ?? 0) + 1);
    }
    return map;
  }, [applications]);
}

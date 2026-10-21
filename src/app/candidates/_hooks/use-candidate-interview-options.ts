import { getJson } from '@/lib/api-client';
import type { Interview } from '@/store/types';
import { useEffect, useState } from 'react';

/**
 * Every non-cancelled interview this candidate has (all jobs), newest first.
 *
 * Fetched into local state on purpose: the shared interview store's `fetch`
 * replaces the list the calendar owns, so scoping it to one candidate would
 * empty the calendar.
 */
export function useCandidateInterviewOptions(
  candidateId: string,
  enabled: boolean
) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  // Starts true so callers never act on the empty pre-fetch list.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getJson<Interview[] | { data: Interview[] }>('/ats/interviews', {
      candidateId,
      limit: 100,
    })
      .then(res => {
        if (cancelled) return;
        setInterviews(
          (Array.isArray(res) ? res : res.data)
            .filter(iv => iv.status !== 'cancelled')
            .sort(
              (a, b) =>
                new Date(b.scheduledAt).getTime() -
                new Date(a.scheduledAt).getTime()
            )
        );
      })
      .catch(() => {
        // Not fatal: the form falls back to entering the details manually.
        if (!cancelled) setInterviews([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId, enabled]);

  return { interviews, loading };
}

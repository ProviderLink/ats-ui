import { useCandidateStore } from '@/store/slices/candidates.store';
import { useEffect } from 'react';

/**
 * Loads the full candidate record while a detail sheet is open. List rows may
 * carry a trimmed profile, so the sheet shows the row at once and fills in the
 * rest when this arrives. Failures are ignored: the row stays on screen.
 */
export function useLoadFullCandidate(id: string | undefined, open: boolean) {
  const fetchOne = useCandidateStore(s => s.fetchOne);
  useEffect(() => {
    if (open && id) void fetchOne(id, { silent: true });
  }, [open, id, fetchOne]);
}

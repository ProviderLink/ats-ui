import { getJson } from '@/lib/api-client';
import type { DispositionReason } from '@/store/slices/disposition-reasons.store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/** Every reason (active and inactive) from the admin endpoint. */
export function useDispositionReasonsAdmin() {
  const [reasons, setReasons] = useState<DispositionReason[]>([]);
  const [loading, setLoading] = useState(false);
  const didFetch = useRef(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      setReasons(await getJson<DispositionReason[]>('/ats/disposition-reasons'));
    } catch (e) {
      toast.error((e as Error).message || 'Failed to load reasons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true;
      fetchAll();
    }
  }, [fetchAll]);

  return { reasons, loading, refetch: fetchAll };
}

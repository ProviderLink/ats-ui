import { useEmailStore } from '@/store';
import type { Email } from '@/store/types';
import { useEffect, useMemo, useState } from 'react';

/** Loads an email and, when it has one, the rest of its thread (oldest first). */
export function useEmailThread(id: string | undefined) {
  const detail = useEmailStore(s => s.detail);
  const fetchOne = useEmailStore(s => s.fetchOne);
  const fetchThread = useEmailStore(s => s.fetchThread);
  const [thread, setThread] = useState<Email[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setThread(null);

    (async () => {
      await fetchOne(id);
      if (cancelled) return;
      const storeState = useEmailStore.getState();
      const current = storeState.detail[id];
      if (storeState.error && !current) setError(storeState.error);
      if (current?.threadId) {
        const threadEmails = await fetchThread(current.threadId);
        if (cancelled) return;
        threadEmails.sort(
          (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
        );
        setThread(threadEmails);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const primary = id ? (detail[id] ?? null) : null;
  const messages = useMemo(() => {
    if (thread) return thread;
    return primary ? [primary] : [];
  }, [thread, primary]);

  return { messages, loading, error };
}

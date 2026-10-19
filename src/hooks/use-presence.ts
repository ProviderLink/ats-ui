import { socketManager } from '@/store/realtime/socket';
import { usePresenceStore } from '@/store/slices/presence.store';
import { useEffect } from 'react';

/** Keep the presence store live while the calling page is mounted. */
export function usePresence(): void {
  useEffect(() => {
    const { setSnapshot, setOnline, clear } = usePresenceStore.getState();
    const unsubscribe = socketManager.subscribePresence({
      onSnapshot: setSnapshot,
      onUpdate: setOnline,
    });
    return () => {
      unsubscribe();
      clear();
    };
  }, []);
}

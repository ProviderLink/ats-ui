import { socketManager } from '@/store/realtime/socket';
import { useEffect } from 'react';

/**
 * Subscribe to a Socket.IO room for real-time updates.
 * Joins on mount / ID change, leaves on unmount.
 *
 * Usage:
 *   useSocketRoom('job', jobId);        // job detail / pipeline pages
 *   useSocketRoom('applications');      // application list pages
 *   useSocketRoom('user', userId);      // dashboard / notification area
 *   useSocketRoom('candidates');        // candidates list
 *   useSocketRoom('jobs');              // jobs list
 *   useSocketRoom('interviews');        // calendar / interviews list
 *   useSocketRoom('clients');           // clients list
 *   useSocketRoom('tags');              // tags list
 */
export function useSocketRoom(room: string, id?: string): void {
  useEffect(() => {
    if (room === 'job' && id) {
      socketManager.joinJob(id);
      return () => socketManager.leaveJob(id);
    }
    if (room === 'applications') {
      socketManager.joinApplication();
      return () => socketManager.leaveApplication();
    }
    if (room === 'user' && id) {
      socketManager.joinUser(id);
      return () => socketManager.leaveUser(id);
    }
    // Generic rooms: candidates, jobs, interviews, clients, tags, etc.
    socketManager.joinRoom(room);
    return () => socketManager.leaveRoom(room);
  }, [room, id]);
}

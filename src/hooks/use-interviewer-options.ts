import { getJson } from '@/lib/api-client';
import type { User } from '@/store/types';
import { useEffect, useSyncExternalStore } from 'react';

/**
 * Roles that belong to the ATS team and can therefore be interviewers.
 *
 * Deliberately ROLE-based rather than `appAccess=ats`: `appAccess` is derived
 * from roles at write time and is `[]` on any user created before that field
 * existed, so filtering on it would silently hide real staff. These five are
 * exactly the roles that appear as ATS personnel in the team screen.
 */
const ATS_STAFF_ROLES = [
  'admin',
  'hiring_manager',
  'recruiter',
  'coordinator',
  'interviewer',
] as const;

interface InterviewerSnapshot {
  interviewers: User[];
  loading: boolean;
  error: string | null;
}

/**
 * ATS staff who can be assigned to an interview.
 *
 * Replaces reading `useUserStore`, which is boot-loaded unfiltered and therefore
 * also holds CRM-only accounts (`client`, `va`) and deactivated users. Those
 * appeared in the interviewer picker as people who are not on the ATS team.
 *
 * Backed by a module-level store rather than component state, for two reasons:
 *
 * 1. The picker lives inside a table row's action menu, so one component
 *    instance exists per row. Per-instance state would fire one request per row;
 *    the shared cache means exactly one request per session.
 * 2. Writing to an external store from an effect is the pattern this repo
 *    already uses (`useIsMobile`, the unread-email badge), and it avoids
 *    `react-hooks/set-state-in-effect`, which is an ERROR here.
 *
 * The cache is in-memory only — it is not persisted, so nothing leaks between
 * sessions on a shared browser.
 */
let snapshot: InterviewerSnapshot = {
  interviewers: [],
  loading: false,
  error: null,
};
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function publish(next: InterviewerSnapshot): void {
  snapshot = next;
  for (const listener of listeners) listener();
}

/**
 * Kick off the load once. Repeated calls (one per mounting row) reuse the same
 * in-flight promise, and a resolved load is never repeated.
 */
function ensureLoaded(): void {
  if (inflight || snapshot.interviewers.length > 0) return;
  publish({ ...snapshot, loading: true, error: null });

  inflight = getJson<User[] | { data: User[] }>('/shared/users', {
    roles: ATS_STAFF_ROLES.join(','),
    isActive: true,
    limit: 200,
  })
    .then(res => {
      const rows = Array.isArray(res) ? res : (res.data ?? []);
      publish({ interviewers: rows, loading: false, error: null });
    })
    .catch(e => {
      publish({
        interviewers: [],
        loading: false,
        error: (e as Error).message,
      });
    })
    .finally(() => {
      inflight = null;
    });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): InterviewerSnapshot {
  return snapshot;
}

/**
 * @param enabled Pass `false` to defer the request until it is actually needed
 *   (e.g. until the picker's dialog is open). The shared cache means enabling it
 *   later still costs at most one request for the whole session.
 */
export function useInterviewerOptions(enabled = true): InterviewerSnapshot {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    if (enabled) ensureLoaded();
  }, [enabled]);

  return state;
}

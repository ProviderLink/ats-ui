/**
 * Session-scoped store teardown.
 *
 * Every store in this app caches its data in `localStorage` via Zustand's
 * `persist` middleware, and those caches are NOT scoped to the signed-in user.
 * They survive a logout, so the next person to use the same browser could see
 * the previous user's clients, team members, and candidate records.
 *
 * `resetBoot()` alone is not enough: it only clears the in-memory boot flag, and
 * because the boot flag is deliberately NOT persisted it resets on every reload
 * anyway — so boot re-fetches and *masks* the stale caches, which then only show
 * up as a brief flash of the previous user's rows on first paint.
 *
 * This module is imported **dynamically** from `auth.store.ts`. That is not
 * optional: `users.store.ts` statically imports `auth.store.ts` (for the inviter
 * name on create), so a static import here would form the cycle
 * `auth.store → session-reset → users.store → auth.store`.
 */

import { useActivityLogStore } from '@/store/slices/activity-logs.store';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useDashboardStore } from '@/store/slices/dashboard.store';
import { useEmailTemplateStore } from '@/store/slices/email-templates.store';
import { useEmailStore } from '@/store/slices/emails.store';
import { useInterviewStore } from '@/store/slices/interviews.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { usePipelineTemplateStore } from '@/store/slices/pipeline-templates.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import { useTagStore } from '@/store/slices/tags.store';
import { useUserStore } from '@/store/slices/users.store';

/**
 * Zustand `persist` keys for every store that caches session data.
 *
 * Deliberately EXCLUDES `ats-auth` — the caller keeps the user/`isAuthenticated`
 * slice intact so the redirect to the login page still works.
 */
export const SESSION_STORE_KEYS = [
  'ats-activity-logs',
  'ats-analytics',
  'ats-applications',
  'ats-candidates',
  'ats-clients',
  'ats-email-templates',
  'ats-emails',
  'ats-interviews',
  'ats-jobs',
  'ats-pipeline-templates',
  'ats-settings',
  'ats-tags',
  'ats-users',
] as const;

/**
 * Clear every session-scoped store and its persisted cache.
 *
 * Idempotent and safe to call when nothing is cached. Never throws: storage can
 * be unavailable (private mode, quota) and that must not block a logout.
 *
 * NOT cleared on purpose:
 * - `ats-auth` — see above.
 * - UI preference keys (`*-page-size`, `*-sort-by`, `*-column-sorting`,
 *   `*-page-index`). These hold no personal data, only a page size or sort
 *   order. Clearing them would reset every user's table layout on every login,
 *   which is a UX regression rather than a privacy fix.
 * - `useBootStore` / `disposition-reasons` / `interview-scorecards` — not
 *   persisted, so they hold no cross-user data. Booleans and workspace config
 *   respectively.
 */
export function resetSessionScopedStores(): void {
  // 1. Drop the in-memory copies first so nothing can re-render from the
  //    previous session between here and the next boot.
  //    Each store also persists the reset state, which is what actually clears
  //    the localStorage payload — step 2 is belt-and-braces for any store whose
  //    `partialize` might not cover every key.
  useActivityLogStore.getState().reset();
  useApplicationStore.getState().reset();
  useCandidateStore.getState().reset();
  useClientStore.getState().reset();
  useDashboardStore.getState().reset();
  useEmailTemplateStore.getState().reset();
  useEmailStore.getState().reset();
  useInterviewStore.getState().reset();
  useJobStore.getState().reset();
  usePipelineTemplateStore.getState().reset();
  useSettingsStore.getState().reset();
  useTagStore.getState().reset();
  useUserStore.getState().reset();

  // 2. Remove the persisted payloads outright so even a reload that skips the
  //    in-memory reset cannot resurrect them.
  try {
    for (const key of SESSION_STORE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable — the in-memory reset above is still applied.
  }
}

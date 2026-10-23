/**
 * Boot loader — calls each store's fetch with limit 9999 once after login.
 * Candidates are deliberately NOT loaded here: they grow without bound, so
 * each page loads the slice it shows (server-side paging) into a shared cache.
 * During boot, isBooted=false so no-op guards in fetch methods don't trigger.
 * After boot, fetch() returns immediately — all filtering is client-side.
 */

import { useApplicationStore } from '@/store/slices/applications.store';
import { useBootStore } from '@/store/slices/boot.store';
import { useAuthStore } from '@/store/slices/auth.store';
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

let bootPromise: Promise<void> | null = null;

/**
 * Stores that must hold data for the app to be usable. Deliberately EXCLUDES
 * `settings` and `email-templates`: an admin with no company settings row, or a
 * workspace with no templates yet, legitimately has nothing there and must not
 * be treated as an outage.
 */
const REQUIRED_STORES = [
  { name: 'clients', store: useClientStore },
  { name: 'jobs', store: useJobStore },
  { name: 'applications', store: useApplicationStore },
  { name: 'interviews', store: useInterviewStore },
  { name: 'tags', store: useTagStore },
  { name: 'users', store: useUserStore },
] as const;

/**
 * Diagnose a boot that produced nothing.
 *
 * Store `fetch()` methods SWALLOW their errors — none of them rethrow — so
 * `Promise.allSettled` always reports "fulfilled" and cannot detect a failure.
 * The real signal is the stores' own `error` state, which they set in their
 * catch blocks.
 *
 * Returns a message when EVERY required store is both empty and errored, i.e. a
 * definitive total outage. Any partial success, a cache-only reload that
 * populated some stores, or a workspace that is genuinely empty all return
 * `null` and boot normally — the gate must never be able to lock a working user
 * out of a working app.
 */
function describeTotalOutage(): string | null {
  const states = REQUIRED_STORES.map(({ name, store }) => {
    const s = store.getState() as {
      items?: unknown[];
      error?: string | null;
    };
    const items = s.items ?? [];
    return { name, empty: items.length === 0, error: s.error ?? null };
  });

  if (states.some(s => !s.empty)) return null;
  const firstError = states.find(s => s.error)?.error;
  if (!firstError) return null;
  if (!states.every(s => s.error)) return null;

  return firstError;
}

export async function bootAllData(): Promise<void> {
  if (bootPromise) return bootPromise;
  const b = useBootStore.getState();
  if (b.isBooted) return;
  b.setBooting();

  const run = (async () => {
    const timings: { request: string; ms: number }[] = [];
    const started = performance.now();
    const timed = (request: string, p: Promise<unknown>) =>
      p.finally(() =>
        timings.push({ request, ms: Math.round(performance.now() - started) })
      );

    // The inbox only feeds the unread badge and the Emails page, which update
    // reactively, so it loads in the background instead of holding the loader.
    // Ineligible candidates are loaded by their own page on demand.
    void useEmailStore.getState().fetch({ limit: 50, page: 1 });

    // The dashboard reads its own slim endpoint, not the lists below, so start
    // it now (whatever page we are on) instead of after the loader goes away;
    // opening the Dashboard later then shows the numbers at once and refreshes.
    void useDashboardStore.getState().fetch();

    // Candidate slices the sidebar pages show are fetched in the background so
    // Talent Pool and Ineligible open instantly. They do not hold the loader.
    void useCandidateStore
      .getState()
      .loadTalentPool()
      .catch(() => undefined);
    if (useAuthStore.getState().user?.roles?.includes('admin')) {
      void useCandidateStore.getState().fetchIneligible();
    }

    const r = await Promise.allSettled([
      timed('clients', useClientStore.getState().fetch({ limit: 9999 })),
      timed('jobs', useJobStore.getState().fetch({ limit: 9999 })),
      timed(
        'applications',
        useApplicationStore.getState().fetch({ limit: 9999 })
      ),
      timed('interviews', useInterviewStore.getState().fetch({ limit: 9999 })),
      timed('tags', useTagStore.getState().fetch()),
      timed('users', useUserStore.getState().fetch({ limit: 9999 })),
      timed('settings', useSettingsStore.getState().fetch()),
      timed('email-templates', useEmailTemplateStore.getState().fetch()),
      timed('pipeline-templates', usePipelineTemplateStore.getState().fetch()),
    ]);

    // Hired page: the candidates behind the hire records, once applications are in.
    const hiredIds = useApplicationStore
      .getState()
      .items.filter(a => a.phase === 'hired')
      .map(a => a.candidateId);
    if (hiredIds.length > 0) {
      void useCandidateStore.getState().ensureByIds(hiredIds);
    }

    if (import.meta.env.DEV) {
      console.table(timings.sort((a, b) => b.ms - a.ms));
    }

    const failed = r.filter(x => x.status === 'rejected');
    if (failed.length) {
      console.warn(
        '[Boot] Partial failures:',
        failed.map(x => String(x.reason))
      );
    }

    // Surface a total outage instead of booting into a convincing-looking empty
    // workspace, which reads as "all our data is gone".
    const outage = describeTotalOutage();
    if (outage) {
      console.warn('[Boot] Total outage:', outage);
      // Release the in-flight marker so "Try again" can actually re-run.
      // Without this the marker would hold this settled promise and every
      // later attempt would resolve instantly without refetching.
      bootPromise = null;
      useBootStore.getState().setError(outage);
      return;
    }

    useBootStore.getState().setBooted();
  })();

  bootPromise = run;
  await run;
}

export function resetBoot(): void {
  bootPromise = null;
  useBootStore.getState().reset();
}

/**
 * Boot loader — calls each store's fetch with limit 9999 once after login.
 * During boot, isBooted=false so no-op guards in fetch methods don't trigger.
 * After boot, fetch() returns immediately — all filtering is client-side.
 */

import { useApplicationStore } from '@/store/slices/applications.store';
import { useBootStore } from '@/store/slices/boot.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
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
  { name: 'candidates', store: useCandidateStore },
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
    const r = await Promise.allSettled([
      useClientStore.getState().fetch({ limit: 9999 }),
      useJobStore.getState().fetch({ limit: 9999 }),
      useCandidateStore.getState().fetch({ limit: 9999 }),
      useCandidateStore.getState().fetchIneligible(),
      useApplicationStore.getState().fetch({ limit: 9999 }),
      useInterviewStore.getState().fetch({ limit: 9999 }),
      useTagStore.getState().fetch(),
      useUserStore.getState().fetch({ limit: 9999 }),
      useSettingsStore.getState().fetch(),
      useEmailTemplateStore.getState().fetch(),
      usePipelineTemplateStore.getState().fetch(),
      useEmailStore.getState().fetch({ limit: 50, page: 1 }),
    ]);

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

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

export async function bootAllData(): Promise<void> {
  if (bootPromise) return bootPromise;
  const b = useBootStore.getState();
  if (b.isBooted) return;
  b.setBooting();

  bootPromise = (async () => {
    const r = await Promise.allSettled([
      useClientStore.getState().fetch({ limit: 9999 }),
      useJobStore.getState().fetch({ limit: 9999 }),
      useCandidateStore.getState().fetch({ limit: 9999 }),
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
        failed.map(x => String((x as any).reason))
      );
    }

    useBootStore.getState().setBooted();
  })();

  await bootPromise;
  return bootPromise;
}

export function resetBoot(): void {
  bootPromise = null;
  useBootStore.getState().reset();
}

/**
 * Post-reconnect resync — refreshes every store after the real-time socket
 * comes back, because events emitted while it was down are not replayed.
 *
 * Each store is re-fetched with the filters it last used, so the view the user
 * is looking at is refreshed rather than swapped for a different slice. Store
 * `fetch()` methods swallow their own errors, so one failing request cannot
 * break the others or leave the app in a worse state than before.
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
import { useTagStore } from '@/store/slices/tags.store';
import { useUserStore } from '@/store/slices/users.store';

let inFlight: Promise<void> | null = null;

export function resyncAllData(): Promise<void> {
  // Before the first boot completes there is nothing stale; boot loads it all.
  if (!useBootStore.getState().isBooted) return Promise.resolve();
  if (inFlight) return inFlight;

  useBootStore.getState().setResyncing(true);
  inFlight = Promise.allSettled([
    useClientStore.getState().fetch(useClientStore.getState().filters),
    useJobStore.getState().fetch(useJobStore.getState().filters),
    useCandidateStore.getState().fetch(useCandidateStore.getState().filters),
    useCandidateStore.getState().ineligibleLoaded
      ? useCandidateStore.getState().fetchIneligible(true)
      : Promise.resolve(),
    useApplicationStore
      .getState()
      .fetch(useApplicationStore.getState().filters),
    useInterviewStore.getState().fetch(useInterviewStore.getState().filters),
    useTagStore.getState().fetch(),
    useUserStore.getState().fetch({ limit: 9999 }),
    useEmailTemplateStore.getState().fetch(),
    usePipelineTemplateStore.getState().fetch(),
    useEmailStore.getState().fetch(useEmailStore.getState().filters),
  ]).then(() => undefined);

  return inFlight.finally(() => {
    inFlight = null;
    useBootStore.getState().setResyncing(false);
  });
}

import type { Application } from '../types';
import type { ApplicationState } from './applications.store.types';

type ApplicationLists = Pick<ApplicationState, 'items' | 'detail'>;

/** Put a fresh application into the list row and, when cached, the detail entry. */
export function replaceApplication(
  s: ApplicationLists,
  id: string,
  app: Application
) {
  const idx = s.items.findIndex(x => x._id === id);
  if (idx !== -1) s.items[idx] = app;
  if (s.detail[id]) s.detail[id] = app;
}

// Socket updates can ship lightweight payloads (e.g. stage-only moves) that
// omit fields the derived maps rely on (currentStage, phase, hiredAt, etc.).
// Merging with the existing record preserves those instead of nulling them.
//
// candidateId / jobId / clientId are preserved too: a lightweight
// application:updated payload (e.g. broadcast when a public apply triggers
// related-job changes) must not null out foreign keys that the
// candidatesInPipelineIds Set and tab counts depend on.
function mergeApplication<T extends Application>(prev: T, patch: Application): T {
  const merged: Application = {
    ...prev,
    ...patch,
    candidateId: patch.candidateId ?? prev.candidateId,
    jobId: patch.jobId ?? prev.jobId,
    clientId: patch.clientId ?? prev.clientId,
    currentStage: patch.currentStage ?? prev.currentStage,
    phase: patch.phase ?? prev.phase,
    hiredAt: patch.hiredAt ?? prev.hiredAt,
    hiredBy: patch.hiredBy ?? prev.hiredBy,
    rejectionReason: patch.rejectionReason ?? prev.rejectionReason,
    closedAt: patch.closedAt ?? prev.closedAt,
    dispositionDate: patch.dispositionDate ?? prev.dispositionDate,
    dispositionReasonId: patch.dispositionReasonId ?? prev.dispositionReasonId,
    dispositionDestination:
      patch.dispositionDestination ?? prev.dispositionDestination,
    isBlocked: patch.isBlocked ?? prev.isBlocked,
  };
  return merged as T;
}

/** Apply a socket-delivered application to the list and the detail cache. */
export function applyApplicationPatch(s: ApplicationLists, app: Application) {
  const idx = s.items.findIndex(x => x._id === app._id);
  if (idx !== -1) s.items[idx] = mergeApplication(s.items[idx], app);
  else s.items.unshift(app);
  if (s.detail[app._id])
    s.detail[app._id] = mergeApplication(s.detail[app._id], app);
}

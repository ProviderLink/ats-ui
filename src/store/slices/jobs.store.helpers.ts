import type { Job } from '../types';
import type { JobState } from './jobs.store.types';

/** Replace the list row (and cached detail) for an existing job. */
export function replaceJob(
  s: Pick<JobState, 'items' | 'detail'>,
  id: string,
  job: Job
) {
  const idx = s.items.findIndex(x => x._id === id);
  if (idx !== -1) s.items[idx] = job;
  if (s.detail[id]) s.detail[id] = job;
}

/** Replace the list row for a job, or add it at the top when new. */
export function upsertJob(s: Pick<JobState, 'items'>, job: Job) {
  const idx = s.items.findIndex(x => x._id === job._id);
  if (idx !== -1) s.items[idx] = job;
  else s.items.unshift(job);
}

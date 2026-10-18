import type { Interview } from '../types';
import type { InterviewState } from './interviews.store.types';

/** Interview endpoint, scoped under an application when one is given. */
export function interviewPath(
  id: string,
  applicationId?: string,
  suffix = ''
): string {
  const base = applicationId
    ? `/ats/applications/${applicationId}/interviews/${id}`
    : `/ats/interviews/${id}`;
  return base + suffix;
}

/** Replace the list row (and cached detail) for an existing interview. */
export function replaceInterview(
  s: Pick<InterviewState, 'items' | 'detail'>,
  id: string,
  interview: Interview
) {
  const idx = s.items.findIndex(x => x._id === id);
  if (idx !== -1) s.items[idx] = interview;
  if (s.detail[id]) s.detail[id] = interview;
}

/** Replace the list row for an interview, or add it at the top when new. */
export function upsertInterview(
  s: Pick<InterviewState, 'items'>,
  interview: Interview
) {
  const idx = s.items.findIndex(x => x._id === interview._id);
  if (idx !== -1) s.items[idx] = interview;
  else s.items.unshift(interview);
}

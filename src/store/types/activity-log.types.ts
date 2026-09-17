/** Resource types tracked by the activity-logs subsystem. Mirrors the
 * `resourceType` segment of `GET /shared/activity-logs/:resourceType/:resourceId`.
 */
export const ActivityResourceType = {
  candidate: 'candidate',
  job: 'job',
  client: 'client',
  application: 'application',
  interview: 'interview',
  user: 'user',
  assignment: 'assignment',
  eod: 'eod',
  performance_review: 'performance_review',
  survey: 'survey',
  tag: 'tag',
  work_entry: 'work_entry',
  settings: 'settings',
} as const;
export type ActivityResourceType =
  (typeof ActivityResourceType)[keyof typeof ActivityResourceType];

/**
 * Activity entries, re-exported so `@/store/types` remains the single import
 * for store-shaped data. The canonical definition is `ActivityEntry` in
 * `@/components/activity-timeline/types` — the normalised shape the timeline
 * renders.
 *
 * Two server fields are deliberately absent from it:
 *   - `updatedAt` — migration-polluted, stripped at the API boundary
 *   - the legacy `type` token — folded into `action` at the same boundary
 */
export type { ActivityEntry } from '@/components/activity-timeline/types';

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
  pipeline_template: 'pipeline_template',
  email_template: 'email_template',
  report: 'report',
} as const;
export type ActivityResourceType =
  (typeof ActivityResourceType)[keyof typeof ActivityResourceType];

/** A single activity log entry. */
export interface ActivityLog {
  _id: string;
  resourceType: ActivityResourceType | string;
  resourceId: string;
  /** Secondary entity the event also concerns, e.g. a scorecard logged against
   * a candidate (`relatedType: 'interview_scorecard'`). */
  relatedType?: string | null;
  relatedId?: string | null;
  action?: string | null;
  description?: string | null;
  summary?: string | null;
  performedBy?: string | null;
  performerName?: string | null;
  performerAvatar?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

/** Filters accepted by `GET /shared/activity-logs`. */
export interface ActivityLogFilters {
  resourceType?: ActivityResourceType | string;
  resourceId?: string;
  action?: string;
  performedBy?: string;
  page?: number;
  limit?: number;
}

/**
 * Response envelope for the activity-logs endpoints. The API may return a bare
 * array or a `{ data, ...pagination }` object.
 *
 * The pagination fields are FLAT, not nested under a `pagination` key. The
 * backend sends them as `meta`, and `api-client` merges `meta` onto the response
 * for array payloads — so `res.pagination` would always be `undefined`. This
 * previously declared a nested `pagination` object, which silently misled any
 * caller that read it.
 */
export interface ActivityLogListResponse {
  data?: ActivityLog[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

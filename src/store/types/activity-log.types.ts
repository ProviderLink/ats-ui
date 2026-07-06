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

/** A single activity log entry. */
export interface ActivityLog {
  _id: string;
  resourceType: ActivityResourceType | string;
  resourceId: string;
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

/** Response envelope for the activity-logs endpoints. The API may return a
 * bare array or `{ data, pagination }`; we normalise both in the store. */
export interface ActivityLogListResponse {
  data?: ActivityLog[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

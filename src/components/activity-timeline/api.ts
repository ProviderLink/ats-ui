/**
 * The API boundary for the activity feed.
 *
 * Everything the backend cannot guarantee is fixed HERE, so the components
 * only ever see clean data:
 *
 *   - legacy `type` → `action` (the 1,462 documents written before the action
 *     field existed; 41% of them carry no `action` at all)
 *   - `updatedAt` is dropped, so a migration-polluted timestamp cannot be
 *     sorted or rendered by accident
 *   - `metadata` is narrowed to the keys the templates declare they consume
 *
 * HTTP lives here; the store is a cache on top of it.
 */

import { getJson } from '@/lib/api-client';
import { isValidObjectId } from '@/lib/utils';
import { ALLOWED_METADATA_KEYS } from './actions';
import { asRecord, asString, type Metadata } from './narrowing';
import type { ActivityEntry } from './types';

/** Shape actually returned by `GET /shared/activity-logs/...`. */
interface RawActivityLog {
  _id?: string;
  id?: string;
  action?: string | null;
  type?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  description?: string | null;
  summary?: string | null;
  metadata?: unknown;
  performedBy?: string | null;
  performerName?: string | null;
  performerAvatar?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ActivityPage {
  entries: ActivityEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Legacy `type` → modern `action`.
 *
 * Transcribed from `ats-crm-backend/src/scripts/migrate-legacy-activity-logs.ts`
 * (`TYPE_TO_ACTION`). The migration only backfills documents it can map;
 * everything else is left with no `action`, which is why this table is
 * duplicated on the read path rather than left to the database.
 */
const LEGACY_TYPE_TO_ACTION: Record<string, string> = {
  // Generic CRUD
  created_job: 'created',
  job_created: 'created',
  created_client: 'created',
  client_created: 'created',
  candidate_created: 'created',
  application_created: 'created',
  created_application: 'created',
  tag_created: 'created',
  user_created: 'created',
  updated_candidate: 'updated',
  candidate_updated: 'updated',
  updated_application: 'updated',
  updated_job: 'updated',
  job_updated: 'updated',
  updated_client: 'updated',
  client_updated: 'updated',
  user_updated: 'updated',
  candidate_deleted: 'deleted',
  client_deleted: 'deleted',
  // Status / pipeline
  candidate_status_changed: 'status_changed',
  job_status_changed: 'status_changed',
  job_closed: 'status_changed',
  candidate_stage_changed: 'stage_changed',
  application_stage_moved: 'stage_changed',
  job_pipeline_assigned: 'pipeline_changed',
  // Application lifecycle
  application_approved: 'approved',
  application_rejected: 'rejected',
  application_notes_updated: 'notes_updated',
  // Talent pool
  candidate_added_to_talent_pool: 'talent_pool_added',
  candidate_talent_pool_added: 'talent_pool_added',
  candidate_talent_pool_removed: 'talent_pool_removed',
  // AI / parsing
  candidate_parsed_data_updated: 'parsed_data_updated',
  ai_resume_parsing_completed: 'parsed_data_updated',
  candidate_ai_score_updated: 'ai_score_updated',
  application_ai_score_updated: 'ai_score_updated',
  ai_candidate_scoring_completed: 'ai_score_updated',
  candidate_ai_validation_updated: 'ai_validation_updated',
  application_ai_validation_updated: 'ai_validation_updated',
  ai_resume_validation_completed: 'ai_validation_updated',
  ai_candidacy_validation_completed: 'ai_validation_updated',
  // Interviews
  interview_scheduled: 'interview_scheduled',
  scheduled_interview: 'interview_scheduled',
  interview_updated: 'interview_updated',
  interview_cancelled: 'interview_cancelled',
  interview_completed: 'interview_completed',
  interview_feedback_submitted: 'interview_feedback_submitted',
  // Client contacts / notes
  client_contact_added: 'contact_added',
  contact_added: 'contact_added',
  client_contact_updated: 'contact_updated',
  client_note_added: 'note_added',
  // Settings
  settings_updated: 'settings_updated',
};

/** Resolve the canonical action, or `recorded` when nothing maps. */
export function resolveAction(raw: RawActivityLog): {
  action: string;
  legacy: boolean;
  legacyType: string | null;
} {
  const action = asString(raw.action);
  if (action) return { action, legacy: false, legacyType: null };

  const legacyType = asString(raw.type);
  if (!legacyType)
    return { action: 'recorded', legacy: true, legacyType: null };

  const mapped = LEGACY_TYPE_TO_ACTION[legacyType.toLowerCase()];
  if (mapped) return { action: mapped, legacy: true, legacyType };
  return { action: 'recorded', legacy: true, legacyType };
}

/**
 * Reduce `metadata` to keys some template actually declares.
 *
 * The backend writes `Schema.Types.Mixed` with no validation from 106 call
 * sites, so this is the single point where unknown keys stop existing. The
 * expanded detail renderer reads from this same object, which is what keeps
 * ids, booleans and provider names out of the UI even when a row is opened.
 */
function allowlistMetadata(raw: unknown): Metadata {
  const source = asRecord(raw);
  if (!source) return {};
  const out: Metadata = {};
  for (const key of Object.keys(source)) {
    if (ALLOWED_METADATA_KEYS.has(key)) out[key] = source[key];
  }
  return out;
}

/** Normalise one raw log. Exported so fixtures reuse the real path. */
export function toEntry(raw: RawActivityLog): ActivityEntry {
  const { action, legacy, legacyType } = resolveAction(raw);
  return {
    id: raw.id ?? raw._id ?? '',
    action,
    resourceType: asString(raw.resourceType) ?? '',
    resourceId: asString(raw.resourceId) ?? '',
    // `description` is free prose written by the caller. It is shown in the
    // expanded block, never in the primary sentence.
    description: asString(raw.description) ?? asString(raw.summary),
    metadata: allowlistMetadata(raw.metadata),
    performedBy: raw.performedBy ?? null,
    performerName: asString(raw.performerName),
    performerAvatar: asString(raw.performerAvatar),
    // `updatedAt` is intentionally not copied. It exists on the server
    // document and is polluted by migrations, so the UI cannot see it at all.
    createdAt: asString(raw.createdAt) ?? new Date(0).toISOString(),
    legacy,
    legacyType,
  };
}

interface Envelope {
  data?: RawActivityLog[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/** Read a page of an entity's feed. */
export async function fetchEntityActivity(
  resourceType: string,
  resourceId: string,
  page = 1,
  limit = 50
): Promise<ActivityPage> {
  if (!isValidObjectId(resourceId)) {
    // Placeholder ids (new records, mocks) have no history and must not
    // produce a 400 from the API.
    return { entries: [], total: 0, page: 1, limit, totalPages: 0 };
  }

  const res = await getJson<RawActivityLog[] | Envelope>(
    `/shared/activity-logs/${resourceType}/${resourceId}`,
    { page, limit }
  );

  // `getJson` unwraps the envelope and, for list responses, flattens the
  // pagination meta onto the object rather than nesting it under `pagination`.
  const list = Array.isArray(res) ? res : (res.data ?? []);
  const meta = Array.isArray(res) ? null : res;

  const entries = list
    .map(toEntry)
    // Always sort by createdAt. The server sorts, but a locally prepended
    // optimistic entry has to slot in correctly.
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return {
    entries,
    total: meta?.total ?? entries.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
    totalPages: meta?.totalPages ?? 1,
  };
}

import { MAX_CHANGES_SHOWN, MAX_VALUE_CHARS, humanKey, sanitizePlain, truncate } from './format';

/**
 * Keys that only repeat what the sentence already says, or expose raw ids.
 * Used when falling back to generic metadata for an unrecognised action.
 */
const NOISE_KEYS = new Set([
  '_id',
  'id',
  'resourceId',
  'resourceType',
  'relatedId',
  'relatedType',
  'createdAt',
  'updatedAt',
  'changes',
  'provider',
  'jobId',
  'candidateId',
  'applicationId',
  'clientId',
  'userId',
  'performedBy',
  'performerName',
  // Consumed by the dedicated stage/status handlers; showing them again as
  // generic chips would duplicate the sentence.
  'from',
  'to',
  'oldStatus',
  'newStatus',
  'fromStatus',
  'fromStage',
  'toStage',
  'fromStageName',
  'toStageName',
  'stageName',
  'status',
  'stageId',
]);

/**
 * Fallback for an action token we do not recognise (typically a historical row
 * written before the current action vocabulary). Rather than inventing a verb
 * from the token, surface whatever metadata the entry does carry.
 */
export function describeGenericMetadata(
  metadata: Record<string, unknown>
): string | null {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (NOISE_KEYS.has(key)) continue;
    if (value === null || value === undefined || value === '') continue;

    // Booleans and numbers read best as `Key: yes` / `Key: 3`. A `false`
    // boolean is skipped — "Legal hold: no" adds nothing on a row we cannot
    // otherwise interpret.
    let rendered: string | null = null;
    if (typeof value === 'boolean') {
      if (value) rendered = 'yes';
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      rendered = String(value);
    } else if (typeof value === 'string') {
      rendered = truncate(sanitizePlain(value), MAX_VALUE_CHARS);
    }
    if (!rendered) continue;

    parts.push(`${humanKey(key)}: ${rendered}`);
    if (parts.length === MAX_CHANGES_SHOWN) break;
  }
  return parts.length > 0 ? parts.join(' \u00b7 ') : null;
}

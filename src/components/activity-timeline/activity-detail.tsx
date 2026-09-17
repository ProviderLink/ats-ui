/**
 * The expanded block beneath a row.
 *
 * This is where genuinely useful context lives, and it is still allowlisted:
 * the entry's `metadata` was already reduced to the keys the registry
 * declares, so ids, `isValid`, provider names, counts and internal flags
 * cannot surface here even though the block is "show everything".
 *
 * Three things are rendered:
 *   - the full caller-supplied description, when one exists
 *   - structured before → after rows derived from `changes`
 *   - the absolute timestamp
 */

import { changeFields, parseChanges } from './changes';
import {
  formatAbsolute,
  formatDateTime,
  sentenceCase,
  tokenToWords,
} from './format';
import { asStringArray } from './narrowing';
import type { ActivityEntry } from './types';

interface DetailRow {
  label: string;
  value: string;
}

/** A free-prose `from`/`to` pair, only when both sides are present. */
function transitionRows(entry: ActivityEntry): DetailRow[] {
  const pairs: [string, string[]][] = [
    ['From', ['from', 'fromStage', 'fromStageName']],
    ['To', ['to', 'toStage', 'toStageName', 'newStatus', 'stageName']],
    ['Reason', ['reasonLabel']],
    ['Destination', ['destination', 'dispositionDestination']],
    ['Template', ['templateName']],
  ];

  const rows: DetailRow[] = [];
  for (const [label, keys] of pairs) {
    for (const key of keys) {
      const raw = entry.metadata[key];
      if (typeof raw !== 'string' || raw.trim() === '') continue;
      // Ids and enums are words or nothing — never a raw token.
      if (/^[a-f\d]{24}$/i.test(raw)) continue;
      rows.push({ label, value: sentenceCase(raw) });
      break;
    }
  }
  return rows;
}

/** `changes` entries that carry a real before/after pair. */
function changeRows(entry: ActivityEntry): DetailRow[] {
  const changes = asStringArray(entry.metadata['changes']) ?? [];
  const parsed = parseChanges(changes);

  const rows: DetailRow[] = [];
  for (const change of parsed) {
    if (change.before && change.after) {
      rows.push({
        label: sentenceCase(change.field),
        value: `${change.before} → ${change.after}`,
      });
    } else if (change.after) {
      rows.push({ label: sentenceCase(change.field), value: change.after });
    } else if (change.before) {
      rows.push({ label: sentenceCase(change.field), value: change.before });
    }
  }
  // When nothing carried a value, list the field names so the block still says
  // something rather than rendering empty.
  if (rows.length === 0 && parsed.length > 0) {
    return [{ label: 'Changed', value: changeFields(changes).join(', ') }];
  }
  return rows;
}

export function ActivityDetail({ entry }: { entry: ActivityEntry }) {
  const rows = [
    ...processRows(entry),
    ...transitionRows(entry),
    ...changeRows(entry),
  ];
  const description = entry.description?.trim();

  return (
    <div className="mt-1 mr-2 mb-2 ml-11 flex flex-col gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs">
      {description && (
        <p className="whitespace-pre-line break-words text-foreground/80">
          {description}
        </p>
      )}

      {rows.length > 0 && (
        <dl className="flex flex-col gap-1">
          {rows.map((row, index) => (
            <div key={`${row.label}-${index}`} className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground/70">
                {row.label}
              </dt>
              <dd className="min-w-0 flex-1 break-words text-foreground/80">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {entry.legacyType && (
        <p className="text-muted-foreground/60">
          Recorded type: <span className="font-mono">{entry.legacyType}</span>
        </p>
      )}

      <p className="text-muted-foreground/60">
        {formatAbsolute(entry.createdAt)}
      </p>
    </div>
  );
}

/** The few remaining per-action pairs worth naming explicitly. */
function processRows(entry: ActivityEntry): DetailRow[] {
  const rows: DetailRow[] = [];

  const scheduled = asStringArray(entry.metadata['fields']);
  if (scheduled && scheduled.length > 0) {
    rows.push({
      label: 'Fields',
      value: scheduled.map(field => tokenToWords(field)).join(', '),
    });
  }

  const method = entry.metadata['method'];
  if (typeof method === 'string' && method) {
    rows.push({ label: 'Method', value: sentenceCase(method) });
  }

  // An interview's meeting channel and round are the two structured facts that
  // exist; the time itself is not logged by the backend.
  const channel = entry.metadata['type'];
  if (typeof channel === 'string' && channel) {
    rows.push({ label: 'Format', value: sentenceCase(channel) });
  }
  const round = entry.metadata['interviewType'];
  if (typeof round === 'string' && round) {
    rows.push({ label: 'Round', value: sentenceCase(round) });
  }

  const scheduledFor = entry.metadata['scheduledAt'];
  if (typeof scheduledFor === 'string' && scheduledFor) {
    rows.push({ label: 'Scheduled for', value: formatDateTime(scheduledFor) });
  }

  return rows;
}

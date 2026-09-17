/**
 * Interprets `metadata.changes`, which is the single richest thing on an
 * `updated` row.
 *
 * The backend builds it as `string[]` — human-readable prose, but prose that
 * embeds both the old and the new value, sometimes a whole HTML job
 * description. On a primary row all we want is *which fields changed*; the
 * before/after pair belongs in the expanded detail.
 */

import { htmlToPlainText } from '@/lib/html';
import { CHANGE_FIELD_PHRASE } from './lexicon';

export interface FieldChange {
  /** Lowercase field phrase, e.g. `email`. */
  field: string;
  /** Raw prose, cleaned. Shown only in the expanded block. */
  raw: string;
  before: string | null;
  after: string | null;
}

/** `"Card title changed from "A" to "B""` / `"Phone number updated"`. */
const CHANGE_RE =
  /^(.*?)\s+(?:changed|updated|set|marked|removed|added)\b([\s\S]*)$/i;
const FROM_TO_RE = /\bfrom\s+["“']?(.+?)["”']?\s+to\s+["“']?(.+?)["”']?\s*$/i;
const TO_VALUE_RE = /\bto\s+["“']?(.+?)["”']?\s*$/i;

/** Strip HTML, collapse whitespace, and truncate a value that is too long to
 * be anything but a payload (job descriptions are routinely 2 kB). */
function cleanValue(value: string): string {
  const text = htmlToPlainText(value).replace(/\s+/g, ' ').trim();
  return text.length > 80 ? `${text.slice(0, 77).trimEnd()}…` : text;
}

function isPayload(value: string): boolean {
  return value.length > 60 || /[{}<>]/.test(value);
}

/** `currentSalary (PHP)` → `current salary`; `BAA marked as signed` → `baa`. */
function toFieldPhrase(label: string): string {
  const lowered = label
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const mapped = CHANGE_FIELD_PHRASE[lowered];
  if (mapped) return mapped;
  // Drop a trailing parenthetical qualifier the map did not cover.
  return lowered.replace(/\s*\(.*$/, '').trim();
}

/** Collapse a change string into its field name. Returns null when there is
 * nothing nameable — a value-only change is not worth a word. */
export function parseChange(value: string): FieldChange | null {
  const raw = cleanValue(value);
  if (!raw) return null;

  const match = CHANGE_RE.exec(raw);
  const field = toFieldPhrase(match?.[1] ?? '');
  if (!field || field.length > 40) return null;

  const tail = (match?.[2] ?? '').trim();
  let before: string | null = null;
  let after: string | null = null;

  const fromTo = FROM_TO_RE.exec(tail);
  if (fromTo) {
    before = isPayload(fromTo[1]!) ? null : fromTo[1]!.trim();
    after = isPayload(fromTo[2]!) ? null : fromTo[2]!.trim();
  } else {
    const toValue = TO_VALUE_RE.exec(tail);
    if (toValue) after = isPayload(toValue[1]!) ? null : toValue[1]!.trim();
  }

  return { field, raw, before, after };
}

/** Parse every element, dropping anything unnameable, and de-duplicate the
 * field list while keeping the first before/after pair per field. */
export function parseChanges(changes: string[]): FieldChange[] {
  const seen = new Set<string>();
  const out: FieldChange[] = [];
  for (const change of changes) {
    const parsed = parseChange(change);
    if (!parsed || seen.has(parsed.field)) continue;
    seen.add(parsed.field);
    out.push(parsed);
  }
  return out;
}

/** Field phrases in the order the backend reported them. */
export function changeFields(changes: string[]): string[] {
  return parseChanges(changes).map(change => change.field);
}

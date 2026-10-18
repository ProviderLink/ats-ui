import {
  MAX_CHANGES_SHOWN,
  MAX_COMPARABLE_CHARS,
  MAX_VALUE_CHARS,
  joinList,
  lowerFirst,
  sanitizePlain,
  stripQuotes,
  truncate,
  upperFirst,
} from './format';

/**
 * Most backend change strings are `"<Field> changed from \"<old>\" to \"<new>\""`.
 * Group 2 is greedy so a value that itself contains ` to ` still parses.
 */
const CHANGE_PATTERN =
  /^(.*?)\s+changed\s+from\s+["']?(.*)["']?\s+to\s+["']?(.*?)["']?$/s;

/**
 * Reduce one backend change string to something a reader can scan.
 *
 * The backend interpolates the raw old and new values, which for fields like
 * `description` is the entire job description. We therefore never echo a long
 * value: short scalars keep their `from → to` comparison (genuinely useful for
 * a status, date or duration), everything else collapses to the field name.
 *
 *   `Description changed from "<h1>POSITION OVERVIEW…" to "<h1>New…"`
 *     → `Description changed`
 *   `Status changed from "open" to "closed"`
 *     → `Status: open → closed`
 */
function describeChange(raw: string): string {
  const match = CHANGE_PATTERN.exec(raw);
  if (match) {
    const field = upperFirst(sanitizePlain(match[1] ?? ''));
    const from = stripQuotes(sanitizePlain(match[2] ?? ''));
    const to = stripQuotes(sanitizePlain(match[3] ?? ''));

    if (!field) return 'Details changed';

    const comparable =
      from !== '' &&
      to !== '' &&
      from.length <= MAX_COMPARABLE_CHARS &&
      to.length <= MAX_COMPARABLE_CHARS;

    return comparable ? `${field}: ${from} \u2192 ${to}` : `${field} changed`;
  }

  // Changes that carry no before/after pair: "Phone number updated",
  // "Tags updated", "Interviewer(s) updated".
  const plain = sanitizePlain(raw);
  return plain ? upperFirst(truncate(plain, MAX_VALUE_CHARS)) : '';
}

/** Compact, readable rendering of the `changes` array the backend records. */
export function describeChanges(changes: string[]): string | null {
  const rendered = changes.map(describeChange).filter(change => change !== '');
  if (rendered.length === 0) return null;

  const shown = rendered.slice(0, MAX_CHANGES_SHOWN);
  const extra = rendered.length - shown.length;
  const joined = shown.join(' \u00b7 ');
  return extra > 0 ? `${joined} (+${extra} more)` : joined;
}

interface ChangeSummary {
  /** Complete clause, e.g. "changed the website and industry". */
  headline: string;
  /** Just the field list, e.g. "website and industry". */
  fields: string;
  /** Optional second line with short before → after values. */
  detail: string | null;
}

/**
 * Reduce the backend's `changes` strings to what a reader needs: WHICH fields
 * changed (and, for a single short value, from what to what).
 *
 *   ['Website updated', 'Industry changed from "A" to "B"']
 *     → headline "changed website and industry", detail "Industry: A → B"
 */
export function summariseChanges(changes: string[]): ChangeSummary | null {
  const fields: string[] = [];
  const phrases: string[] = [];
  const pairs: { field: string; from: string; to: string }[] = [];

  for (const raw of changes) {
    const match = CHANGE_PATTERN.exec(raw);
    if (match) {
      const field = lowerFirst(sanitizePlain(match[1] ?? ''));
      if (!field) continue;
      fields.push(field);
      const from = stripQuotes(sanitizePlain(match[2] ?? ''));
      const to = stripQuotes(sanitizePlain(match[3] ?? ''));
      if (
        from &&
        to &&
        from.length <= MAX_COMPARABLE_CHARS &&
        to.length <= MAX_COMPARABLE_CHARS
      ) {
        pairs.push({ field, from, to });
      }
      continue;
    }
    const plain = sanitizePlain(raw);
    if (!plain) continue;
    const stripped = plain.replace(/\s+(updated|changed|removed)$/i, '');
    if (stripped !== plain) {
      fields.push(lowerFirst(truncate(stripped, MAX_VALUE_CHARS)));
    } else {
      phrases.push(lowerFirst(truncate(plain, MAX_VALUE_CHARS)));
    }
  }

  if (fields.length === 0 && phrases.length === 0) return null;

  const list = joinList(fields);
  const only = pairs[0];
  if (fields.length === 1 && phrases.length === 0 && only) {
    return {
      headline: `changed ${only.field} from ${only.from} to ${only.to}`,
      fields: list,
      detail: null,
    };
  }

  const parts = [fields.length > 0 ? `changed ${list}` : null, ...phrases];
  const detail =
    pairs.length > 0
      ? pairs
          .slice(0, MAX_CHANGES_SHOWN)
          .map(p => `${upperFirst(p.field)}: ${p.from} \u2192 ${p.to}`)
          .join(' \u00b7 ')
      : null;
  return {
    headline: parts.filter(Boolean).join(', '),
    fields: list,
    detail,
  };
}

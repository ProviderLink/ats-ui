/**
 * Narrowing helpers for `metadata`.
 *
 * `metadata` is `Schema.Types.Mixed` on the backend and written by 106 call
 * sites with no validation, so every read goes through one of these. There is
 * no `any` and no blind cast anywhere in the timeline.
 */

export type Metadata = Record<string, unknown>;

export function asRecord(value: unknown): Metadata | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Metadata)
    : null;
}

export function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  // Numbers and booleans are frequently written where a string is expected;
  // stringifying them is safe, rendering them raw is not.
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

export function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out = value
    .map(item => asString(item))
    .filter((item): item is string => item !== null);
  return out.length > 0 ? out : null;
}

/** First non-empty string among `keys`. */
export function firstString(
  meta: Metadata,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const value = asString(meta[key]);
    if (value) return value;
  }
  return null;
}

/** A string that is worth showing as a human word: not an id, not a URL. */
export function humanName(value: string | null): string | null {
  if (!value) return null;
  if (/^[a-f\d]{24}$/i.test(value)) return null;
  if (/^https?:\/\//i.test(value)) return null;
  return value;
}

/** A job title from a flat key or a nested job document. */
export function jobTitle(meta: Metadata): string | null {
  const direct = humanName(
    firstString(meta, ['jobTitle', 'appliedJobTitle', 'title'])
  );
  if (direct) return direct;
  const nested = asRecord(meta['job']);
  if (!nested) return null;
  return humanName(firstString(nested, ['title', 'jobTitle']));
}

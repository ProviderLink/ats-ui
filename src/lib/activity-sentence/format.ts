import { htmlToPlainText } from '@/lib/html';
import { INTERVIEW_MEETING_TYPE_LABELS } from '@/store/types/enums';
import { LOCALE } from '../activity-time';

/**
 * Longest value we will ever print for a single metadata field. Anything
 * longer (job descriptions, notes, pasted paragraphs) is clipped on a word
 * boundary — a supporting line should be readable at a glance, not scrolled.
 */
export const MAX_VALUE_CHARS = 64;

/** Hard cap for the assembled supporting line under the sentence. */
export const MAX_DETAIL_LINE = 96;

/**
 * Longest value we still show in a `from → to` comparison. Beyond this the
 * comparison is noise (a 40-character-plus blob on each side), so we fall back
 * to naming the field only.
 */
export const MAX_COMPARABLE_CHARS = 36;

/** How many field changes are listed before collapsing into "(+N more)". */
export const MAX_CHANGES_SHOWN = 2;

/** Strip HTML, collapse whitespace and trim — no truncation. */
export function sanitizePlain(value: string): string {
  return htmlToPlainText(value).replace(/\s+/g, ' ').trim();
}

/** Remove the wrapping quotes the backend adds around compared values. */
export function stripQuotes(value: string): string {
  return value.replace(/^["']+|["']+$/g, '').trim();
}

/** Shorten to `max` characters, preferring to break on a word boundary. */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const clipped = value.slice(0, max);
  const lastSpace = clipped.lastIndexOf(' ');
  const body = lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return `${body.trim()}\u2026`;
}

/**
 * Sanitise a value coming from `metadata` for display: strip any HTML the
 * backend embedded (job descriptions, notes) and cap the length so a single
 * entry can never blow up the row.
 */
export function clean(value: string): string {
  return truncate(sanitizePlain(value), MAX_VALUE_CHARS);
}

export function str(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return clean(value);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

export function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is string => typeof v === 'string' && v.trim() !== ''
  );
}

/** Turn a machine enum (`permanently_ineligible`) into prose. */
export function humanEnum(value: string): string {
  const spaced = value.replace(/_/g, ' ');
  return /^[a-z]/.test(spaced) ? spaced : spaced.toLowerCase();
}

/** Prefer a typed label over the raw enum when we have one. */
export function interviewTypeLabel(value: string | null): string | null {
  if (!value) return null;
  return INTERVIEW_TYPE_LABELS[value] ?? humanEnum(value);
}

/**
 * Wording for an interview kind, avoiding "Technical Interview interview":
 * `Technical Interview` → "a Technical interview",
 * `Initial Screening` → "an Initial Screening interview".
 */
export function interviewTypePhrase(label: string): string {
  const base = label.replace(/\s+interview$/i, '') || label;
  // Acronyms (HR, QA) take "an" despite the consonant letter.
  const article =
    /^[A-Z]{2,}/.test(base) || /^[aeiou]/i.test(base) ? 'an' : 'a';
  return `${article} ${base} interview`;
}

const INTERVIEW_TYPE_LABELS: Record<string, string> =
  INTERVIEW_MEETING_TYPE_LABELS;

/** Capitalise the first character only — keeps acronyms like "AI" intact. */
export function upperFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Read the first present key from metadata. */
export function pick(
  metadata: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = str(metadata[key]);
    if (value) return value;
  }
  return null;
}

/** Lower-case the first letter, leaving acronyms (`CRM`, `AI`) alone. */
export function lowerFirst(value: string): string {
  return /^[A-Z]{2,}/.test(value)
    ? value
    : value.charAt(0).toLowerCase() + value.slice(1);
}

/** `a`, `a and b`, `a, b and c` — or `a, b and 2 more` for long lists. */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length > 3) {
    return `${items[0]}, ${items[1]} and ${items.length - 2} more`;
  }
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** `82/100` when the score sits on a 0-100 scale, otherwise the raw value. */
export function formatScore(score: number | null): string | null {
  if (score === null) return null;
  return score >= 0 && score <= 100 ? `${score}/100` : String(score);
}

/** "a call note", "an email note", "a note" — from the note's contact method. */
export function noteLabel(method: string | null): string {
  if (!method || method === 'other') return 'a note';
  return `${/^[aeiou]/i.test(method) ? 'an' : 'a'} ${method} note`;
}

/**
 * Rejection reasons are logged under the `settings` resource with their label
 * and category as metadata. Name the reason instead of "the workspace settings".
 */
export function describeReason(
  verb: string,
  metadata: Record<string, unknown>
): { text: string; detail: string | null } | null {
  const label = str(metadata['label']);
  if (!label) return null;
  const category = str(metadata['category']);
  return {
    text: `${verb} the rejection reason \u201c${label}\u201d`,
    detail: category ? `Category: ${humanEnum(category)}` : null,
  };
}

/** "OpenAI" / "Claude" for the engine that produced an AI entry. */
export function providerLabel(value: string | null): string | null {
  if (!value) return null;
  if (value.toLowerCase() === 'openai') return 'OpenAI';
  if (value.toLowerCase() === 'claude') return 'Claude';
  return upperFirst(value);
}

/** "Tue, Oct 14, 14:30" in the given zone; null when the value is unusable. */
export function formatWhen(value: unknown, timeZone?: string): string | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  try {
    return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone }).format(
      date
    );
  } catch {
    return new Intl.DateTimeFormat(LOCALE, options).format(date);
  }
}

/**
 * Turn a metadata key into a label: `stageName` → `Stage name`,
 * `isBlocked` → `Is blocked`.
 */
export function humanKey(key: string): string {
  return upperFirst(
    key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
  );
}

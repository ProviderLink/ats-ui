/**
 * Pure formatting helpers for the timeline. No React, no colour, no I/O.
 *
 * The character cap lives here because "truncate the qualifier, not the verb"
 * has to be enforced while a sentence is being built, not after it is rendered.
 */

/** Hard cap for a primary row sentence. */
export const MAX_SENTENCE_CHARS = 110;

/** Count in code points so an emoji or accent never splits a surrogate pair. */
function countChars(value: string): number {
  return Array.from(value).length;
}

/** Cut to `max` code points, preferring a word boundary, and ellipsise. */
function cut(value: string, max: number): string {
  const chars = Array.from(value);
  if (chars.length <= max) return value;
  // Reserve one code point for the ellipsis so the result still fits.
  const sliced = chars
    .slice(0, Math.max(0, max - 1))
    .join('')
    .trimEnd();
  const boundary = sliced.lastIndexOf(' ');
  // Only honour the word boundary when it does not throw away most of the text.
  const cutAt = boundary > sliced.length * 0.6 ? boundary : sliced.length;
  const clipped = sliced.slice(0, cutAt).replace(/[\s,;:—–-]+$/, '');
  // Never stack a second ellipsis onto one already there.
  return /…$/.test(clipped) ? clipped : `${clipped}…`;
}

/**
 * `a` or `an`, chosen from the following word.
 *
 * Without this the fallback phrases render as "a application" / "a account",
 * which is the single most visible tell of machine-written text.
 */
export function article(word: string): 'a' | 'an' {
  // Consonant-sounding vowels: `a user`, `a one-off`, `a European`.
  if (/^(uni|use|user|usual|eu|one|once)/i.test(word)) return 'a';
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

/** Connectors that must never be left dangling after a truncation. */
const DANGLING =
  /[\s,;:—–-]+(?:and|or|by|to|from|with|for|the|a|an)?[\s,;:—–-]*$/i;

/**
 * Cap a qualifier (the trailing, optional half of a sentence) at `max` code
 * points. Trailing punctuation and dangling connectives are removed so the
 * result always reads as a finished phrase.
 */
export function capQualifier(value: string, max = MAX_SENTENCE_CHARS): string {
  const trimmed = value.trim();
  if (countChars(trimmed) <= max) return trimmed;
  return cut(trimmed, max).replace(DANGLING, '');
}

/**
 * Append a qualifier to a sentence, capping the qualifier — never the verb —
 * to whatever room is left inside the row budget.
 */
export function withQualifier(
  sentence: string,
  qualifier: string | null | undefined,
  separator = ' — '
): string {
  const q = (qualifier ?? '').trim();
  if (!q) return sentence;
  const budget =
    MAX_SENTENCE_CHARS - countChars(sentence) - countChars(separator);
  if (budget < 12) return sentence;
  return `${sentence}${separator}${capQualifier(q, budget)}`;
}

/**
 * Final safety net. Templates cap their own qualifiers, so this only fires on
 * a genuinely over-long verb phrase.
 *
 * A trailing ` by {Actor}` is preserved rather than truncated away: losing the
 * actor is a worse outcome than losing the end of a stage name.
 */
export function capSentence(sentence: string): string {
  if (countChars(sentence) <= MAX_SENTENCE_CHARS) return sentence;

  const tail = / by [^,]{1,40}$/.exec(sentence);
  if (!tail) return cut(sentence, MAX_SENTENCE_CHARS);

  const body = sentence.slice(0, tail.index);
  const budget = MAX_SENTENCE_CHARS - countChars(tail[0]) - 1;
  return `${cut(body, budget)}${tail[0]}`;
}

/** `['email', 'address', 'tags']` → `email, address and tags`. */
export function listPhrase(items: string[], max = 3): string {
  const kept = items.filter(Boolean).slice(0, max);
  if (kept.length === 0) return '';
  if (kept.length === 1) return kept[0]!;
  return `${kept.slice(0, -1).join(', ')} and ${kept[kept.length - 1]}`;
}

/** `sent_email` → `sent email`. Used for legacy tokens and enum values. */
export function tokenToWords(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Uppercase the first character only — never title-case a sentence. */
export function capitalizeFirst(value: string): string {
  const words = value.trim();
  if (!words) return '';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Lowercase everything after the first character, then uppercase the first. */
export function sentenceCase(value: string): string {
  const words = tokenToWords(value);
  if (!words) return '';
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

/** First letter of each word, max 2 — the avatar fallback. */
export function initials(name: string): string {
  const parts = name
    .split(/\s+/)
    .map(part => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

// ── Time ────────────────────────────────────────────────────────────────────

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** Compact relative label for the right rail: `now`, `5m`, `3h`, `3d`, `2w`. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const delta = Date.now() - then;
  if (delta < 0) return 'now';
  if (delta < MINUTE) return 'now';
  if (delta < HOUR) return `${Math.floor(delta / MINUTE)}m`;
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h`;
  if (delta < WEEK) return `${Math.floor(delta / DAY)}d`;
  if (delta < MONTH) return `${Math.floor(delta / WEEK)}w`;
  if (delta < YEAR) return `${Math.floor(delta / MONTH)}mo`;
  return `${Math.floor(delta / YEAR)}y`;
}

/** `Sep 20, 8:00 AM` — the shape enums and ISO strings become in a sentence. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Full absolute stamp, used as the tooltip and in the expanded block. */
export function formatAbsolute(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Local calendar key for day grouping — never derived from the UTC string. */
export function dayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `Today` / `Yesterday` / `3 days ago` / `12 Sep 2026`. */
export function dayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  const midnight = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((midnight(new Date()) - midnight(date)) / DAY);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

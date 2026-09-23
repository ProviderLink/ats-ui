/**
 * Single source of truth for the timezones the workspace can be set to.
 *
 * The value stored in the backend `Settings.companyTimezone` is an IANA
 * timezone id (e.g. `America/Chicago`). Everything on the server — interview
 * emails, EOD reminders, survey dispatcher, PDF exports — formats and schedules
 * using this value, so it MUST be a real IANA id and not a display label.
 */

export type TimezoneGroup = 'United States' | 'Asia' | 'Europe' | 'Other';

export interface TimezoneOption {
  /** IANA timezone identifier — this is what gets persisted. */
  value: string;
  /** Short label, e.g. "Central (CT)". */
  label: string;
  /** City / region hint shown as secondary text. */
  region: string;
  group: TimezoneGroup;
}

/**
 * Curated list. It intentionally leads with the two locations this workspace
 * operates in (Katy, Texas and Dhaka, Bangladesh) so the common case is one
 * click away, then falls back to the broader set of common zones.
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  {
    value: 'America/Chicago',
    label: 'Central (CT)',
    region: 'Katy, Texas, USA',
    group: 'United States',
  },
  {
    value: 'Asia/Dhaka',
    label: 'Bangladesh Standard (BST)',
    region: 'Dhaka, Bangladesh',
    group: 'Asia',
  },
  {
    value: 'America/New_York',
    label: 'Eastern (ET)',
    region: 'New York, USA',
    group: 'United States',
  },
  {
    value: 'America/Denver',
    label: 'Mountain (MT)',
    region: 'Denver, USA',
    group: 'United States',
  },
  {
    value: 'America/Los_Angeles',
    label: 'Pacific (PT)',
    region: 'Los Angeles, USA',
    group: 'United States',
  },
  {
    value: 'America/Phoenix',
    label: 'Mountain — no DST (MST)',
    region: 'Phoenix, USA',
    group: 'United States',
  },
  {
    value: 'America/Anchorage',
    label: 'Alaska (AKT)',
    region: 'Anchorage, USA',
    group: 'United States',
  },
  {
    value: 'Pacific/Honolulu',
    label: 'Hawaii (HST)',
    region: 'Honolulu, USA',
    group: 'United States',
  },
  {
    value: 'Asia/Kolkata',
    label: 'India Standard (IST)',
    region: 'Kolkata, India',
    group: 'Asia',
  },
  {
    value: 'Asia/Karachi',
    label: 'Pakistan Standard (PKT)',
    region: 'Karachi, Pakistan',
    group: 'Asia',
  },
  {
    value: 'Asia/Dubai',
    label: 'Gulf Standard (GST)',
    region: 'Dubai, UAE',
    group: 'Asia',
  },
  {
    value: 'Asia/Manila',
    label: 'Philippine Standard (PST)',
    region: 'Manila, Philippines',
    group: 'Asia',
  },
  {
    value: 'Asia/Singapore',
    label: 'Singapore Standard (SGT)',
    region: 'Singapore',
    group: 'Asia',
  },
  {
    value: 'Asia/Tokyo',
    label: 'Japan Standard (JST)',
    region: 'Tokyo, Japan',
    group: 'Asia',
  },
  {
    value: 'Europe/London',
    label: 'London (GMT/BST)',
    region: 'London, United Kingdom',
    group: 'Europe',
  },
  {
    value: 'Europe/Paris',
    label: 'Central European (CET)',
    region: 'Paris, France',
    group: 'Europe',
  },
  {
    value: 'Europe/Berlin',
    label: 'Central European (CET)',
    region: 'Berlin, Germany',
    group: 'Europe',
  },
  {
    value: 'Europe/Warsaw',
    label: 'Central European (CET)',
    region: 'Warsaw, Poland',
    group: 'Europe',
  },
  {
    value: 'Australia/Sydney',
    label: 'Australian Eastern (AET)',
    region: 'Sydney, Australia',
    group: 'Other',
  },
  {
    value: 'UTC',
    label: 'UTC',
    region: 'Coordinated Universal Time',
    group: 'Other',
  },
];

/** Display order for the grouped dropdown. */
export const TIMEZONE_GROUP_ORDER: TimezoneGroup[] = [
  'United States',
  'Asia',
  'Europe',
  'Other',
];

export const TIMEZONE_GROUPS: {
  group: TimezoneGroup;
  options: TimezoneOption[];
}[] = TIMEZONE_GROUP_ORDER.map(group => ({
  group,
  options: TIMEZONE_OPTIONS.filter(tz => tz.group === group),
})).filter(g => g.options.length > 0);

export const DEFAULT_TIMEZONE = 'America/Chicago';

const optionByValue = new Map(TIMEZONE_OPTIONS.map(tz => [tz.value, tz]));

/** True if the value is a valid IANA timezone according to the runtime. */
export function isValidTimezone(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Current UTC offset for a timezone, e.g. "UTC−05:00". Returns `null` when the
 * value is not a usable IANA id.
 */
export function getTimezoneOffsetLabel(
  value: string,
  at: Date = new Date()
): string | null {
  if (!isValidTimezone(value)) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: value,
      timeZoneName: 'longOffset',
    }).formatToParts(at);
    const name = parts.find(p => p.type === 'timeZoneName')?.value;
    if (!name) return null;
    // "GMT-05:00" → "UTC−05:00"; a plain "GMT" means zero offset.
    return name === 'GMT' ? 'UTC+00:00' : name.replace('GMT', 'UTC');
  } catch {
    return null;
  }
}

/**
 * Human-readable description for any timezone, including ones that are no
 * longer in the curated list (so an existing saved value never renders blank).
 */
export function describeTimezone(value: string): string {
  const known = optionByValue.get(value);
  if (known) return `${known.label} — ${known.region}`;
  return value;
}

/** Label used inside a `SelectItem` for a given option. */
export function timezoneOptionLabel(option: TimezoneOption): string {
  const offset = getTimezoneOffsetLabel(option.value);
  return offset
    ? `${option.label} · ${offset} — ${option.region}`
    : `${option.label} — ${option.region}`;
}

/* ────────────────────────────────────────────────────────────────────────
 * Wall-clock ⇄ instant conversion
 *
 * An interview stores a UTC instant plus the IANA timezone it was scheduled
 * in. The time the organiser TYPED is a wall clock in THAT zone, so it can
 * never be round-tripped through the browser's own local time — doing so
 * silently reinterprets "2 PM Chicago" as "2 PM wherever this laptop is".
 * These helpers are the only correct path between the two.
 * ──────────────────────────────────────────────────────────────────────── */

/** Cached `Intl.DateTimeFormat` per zone — constructing one is expensive and
 * these run per rendered interview. `en-CA` is used because it renders as
 * `YYYY-MM-DD`.
 */
const WALL_CLOCK_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WALL_CLOCK_TIME_RE = /^\d{2}:\d{2}$/;

const WALL_CLOCK_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function wallClockFormatter(timezone: string): Intl.DateTimeFormat {
  let f = WALL_CLOCK_FORMATTERS.get(timezone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    WALL_CLOCK_FORMATTERS.set(timezone, f);
  }
  return f;
}

function wallClockPartsIn(instant: Date, timezone: string): {
  date: string;
  time: string;
} {
  const out: Record<string, string> = {};
  for (const p of wallClockFormatter(timezone).formatToParts(instant)) {
    if (p.type !== 'literal') out[p.type] = p.value;
  }
  // Some runtimes report midnight as "24" under hour12:false.
  const hour = out.hour === '24' ? '00' : out.hour;
  return {
    date: `${out.year}-${out.month}-${out.day}`,
    time: `${hour}:${out.minute}`,
  };
}

/** Offset of `timezone` from UTC, in ms, at the given instant. */
function offsetAt(instantMs: number, timezone: string): number {
  const p = wallClockPartsIn(new Date(instantMs), timezone);
  // Both sides are parsed as if UTC, so the difference IS the offset.
  return Date.parse(`${p.date}T${p.time}:00Z`) - instantMs;
}

/**
 * The calendar date (`YYYY-MM-DD`) an instant falls on **in `timezone`**.
 *
 * Use this instead of slicing the ISO string: `scheduledAt` is UTC, so a
 * 23:00 UTC interview belongs to the *next* day in Dhaka. Returns `dateStr`'s
 * own first 10 chars if `timezone` is missing/invalid, so callers degrade to
 * the old behaviour rather than rendering nothing.
 */
export function getZonedDate(
  scheduledAt: string | null | undefined,
  timezone?: string | null,
  fallbackTimezone = DEFAULT_TIMEZONE
): string {
  if (!scheduledAt) return '';
  const tz = timezone && isValidTimezone(timezone) ? timezone : fallbackTimezone;
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime()) || !isValidTimezone(tz)) {
    return scheduledAt.slice(0, 10);
  }
  return wallClockPartsIn(d, tz).date;
}

/**
 * The wall-clock time (`HH:mm`) an instant reads as **in `timezone`**.
 * Same contract as `getZonedDate` for the fallback path.
 */
export function getZonedTime(
  scheduledAt: string | null | undefined,
  timezone?: string | null,
  fallbackTimezone = DEFAULT_TIMEZONE
): string {
  if (!scheduledAt) return '';
  const tz = timezone && isValidTimezone(timezone) ? timezone : fallbackTimezone;
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime()) || !isValidTimezone(tz)) {
    return scheduledAt.slice(11, 16);
  }
  return wallClockPartsIn(d, tz).time;
}

/**
 * Interpret a typed wall clock (`YYYY-MM-DD` + `HH:mm`) as being **in
 * `timezone`** and return the corresponding UTC instant as an ISO string.
 *
 * This is the inverse of `getZonedDate`/`getZonedTime`, and the replacement for
 * `new Date(\`${date}T${time}:00\`).toISOString()` — that version read the
 * wall clock as *browser-local*, which is why the timezone picker had no effect
 * on the stored instant.
 *
 * Resolved by comparing the zone's offset at two candidate instants: for a
 * wall clock that exists exactly once (every ordinary case) the first guess is
 * already right; the second pass corrects the rare case where the guess landed
 * on the other side of a DST transition.
 *
 * DST edge cases: a nonexistent time (the 02:30 that spring-forward skips)
 * resolves to the instant after the gap; an ambiguous time (the 01:30 that
 * fall-back repeats) resolves to the first/DST occurrence. Both are valid
 * instants and are far better than the silent cross-timezone shift this
 * replaces.
 */
export function zonedWallClockToUtc(
  dateStr: string,
  timeStr: string,
  timezone: string,
  fallbackTimezone = DEFAULT_TIMEZONE
): string {
  const tz = timezone && isValidTimezone(timezone) ? timezone : fallbackTimezone;
  // Validate the SHAPE first. `Date.parse` is lenient — it happily accepts
  // "T:00Z" and returns a year-2000 date — so a NaN check alone would let an
  // empty or half-filled form through and silently save a bogus interview.
  if (!WALL_CLOCK_DATE_RE.test(dateStr) || !WALL_CLOCK_TIME_RE.test(timeStr)) {
    return '';
  }
  const naive = Date.parse(`${dateStr}T${timeStr}:00Z`);
  if (Number.isNaN(naive)) return '';
  // Without a usable zone there is nothing to convert against — return the
  // wall clock treated as UTC rather than inventing a value.
  if (!isValidTimezone(tz)) return new Date(naive).toISOString();

  const firstOffset = offsetAt(naive, tz);
  let resolved = naive - firstOffset;
  const secondOffset = offsetAt(resolved, tz);
  if (secondOffset !== firstOffset) resolved = naive - secondOffset;
  return new Date(resolved).toISOString();
}


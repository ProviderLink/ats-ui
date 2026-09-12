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

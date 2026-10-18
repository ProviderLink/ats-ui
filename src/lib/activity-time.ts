function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Day heading for a group of entries: "Today", "Yesterday", "12 Sep" and, once
 * the entry leaves this year, "12 Sep 2025".
 */
export function formatActivityDay(
  value: string | null | undefined,
  now: Date = new Date()
): string {
  const date = value ? new Date(value) : new Date(NaN);
  if (Number.isNaN(date.getTime())) return '';
  if (isSameDay(date, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  const dayMonth = new Intl.DateTimeFormat(LOCALE, DAY_MONTH_FORMAT).format(
    date
  );
  return date.getFullYear() === now.getFullYear()
    ? dayMonth
    : `${dayMonth} ${date.getFullYear()}`;
}

/** Clock time only ("14:32"); the day heading carries the date. */
export function formatActivityClock(value: string | null | undefined): string {
  const date = value ? new Date(value) : new Date(NaN);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(LOCALE, TIME_FORMAT).format(date);
}

export interface ActivityTime {
  /** Compact in-row label — "14:32", "Yesterday 14:32", "12 Sep 14:32". */
  label: string;
  /** Full absolute timestamp, for tooltips and `title` attributes. */
  absolute: string;
  /** ISO string for `<time dateTime>`. */
  dateTime: string;
  /** `true` when the event happened within the last hour. */
  isRecent: boolean;
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

export const DAY_MONTH_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
};

/** Locale for month abbreviations — matches `formatDate` in `lib/utils.ts`. */
export const LOCALE = 'en-US';

/**
 * Format an activity timestamp so a reader can always see a date and a time
 * without hovering: today/yesterday are labelled, anything older shows the
 * day and month, and a year suffix appears once the entry leaves this year.
 */
export function formatActivityTime(
  value: string | null | undefined,
  now: Date = new Date()
): ActivityTime {
  const date = value ? new Date(value) : new Date(NaN);
  if (Number.isNaN(date.getTime())) {
    return { label: '', absolute: '', dateTime: '', isRecent: false };
  }

  const time = new Intl.DateTimeFormat(LOCALE, TIME_FORMAT).format(date);
  const absolute = new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (isSameDay(date, now)) {
    label = time;
  } else if (isSameDay(date, yesterday)) {
    label = `Yesterday ${time}`;
  } else {
    const dayMonth = new Intl.DateTimeFormat(LOCALE, DAY_MONTH_FORMAT).format(
      date
    );
    label =
      date.getFullYear() === now.getFullYear()
        ? `${dayMonth} ${time}`
        : `${dayMonth} ${date.getFullYear()} ${time}`;
  }

  const ageMs = now.getTime() - date.getTime();
  return {
    label,
    absolute,
    dateTime: date.toISOString(),
    isRecent: ageMs >= 0 && ageMs < 60 * 60 * 1000,
  };
}

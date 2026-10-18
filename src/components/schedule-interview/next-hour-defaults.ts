import { getZonedDate, getZonedTime } from '@/lib/timezones';

/**
 * Default start: the next whole hour **on the wall clock of `timezone`**.
 *
 * Two traps this avoids:
 * 1. Deriving the date from `toISOString()` mixed a UTC day with a local clock,
 *    so west of UTC the form pre-filled TOMORROW (e.g. Chicago 19:30 → 01:00Z
 *    the next day).
 * 2. The defaults are submitted through `zonedWallClockToUtc(..., timezone)`,
 *    which reads them as a wall clock in the SELECTED zone — not in the
 *    browser's. Building them from browser-local getters therefore shifted the
 *    time by the difference between the two zones.
 */
export function nextHourDefaults(timezone: string) {
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);
  const date = getZonedDate(nextHour.toISOString(), timezone);
  const time = getZonedTime(nextHour.toISOString(), timezone);
  return {
    date,
    // Round down to the hour, keeping the zone's own date (so 23:xx local in a
    // zone that has already rolled over still gets that zone's next day).
    time: time ? `${time.slice(0, 2)}:00` : '',
  };
}

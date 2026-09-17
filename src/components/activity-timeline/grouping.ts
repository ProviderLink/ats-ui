/**
 * Repeat collapsing and day bucketing. Pure functions, no React.
 *
 * Collapsing is what removes most of the noise in a real feed: the backend
 * double- and triple-logs AI runs, and a bulk edit produces a run of identical
 * rows. Consecutive entries with the same actor, action and resource inside a
 * five-minute window become one row that can be expanded back out.
 */

import { dayKey, dayLabel } from './format';
import type { ActivityEntry, ActivityRowGroup } from './types';

/** Entries this close together are one event, not several. */
const COLLAPSE_WINDOW_MS = 5 * 60 * 1000;

/** Identity of an event for collapsing purposes. */
function signature(entry: ActivityEntry): string {
  return [
    entry.action,
    entry.resourceType,
    entry.resourceId,
    entry.performerName ?? '',
  ].join('|');
}

/**
 * Collapse runs of identical consecutive entries.
 *
 * Only *consecutive* entries merge, so a genuine repeat of the same action an
 * hour later stays a separate row.
 */
export function collapseRepeats(entries: ActivityEntry[]): ActivityRowGroup[] {
  const groups: ActivityRowGroup[] = [];

  for (const entry of entries) {
    const previous = groups[groups.length - 1];
    const last = previous?.entries[previous.entries.length - 1];
    const withinWindow =
      last !== undefined &&
      Math.abs(Date.parse(last.createdAt) - Date.parse(entry.createdAt)) <=
        COLLAPSE_WINDOW_MS;

    if (
      previous &&
      last &&
      withinWindow &&
      signature(last) === signature(entry)
    ) {
      previous.entries.push(entry);
      continue;
    }
    groups.push({ key: entry.id, entries: [entry], collapsed: false });
  }

  return groups.map(group => ({
    ...group,
    collapsed: group.entries.length > 1,
  }));
}

export interface DaySection {
  key: string;
  label: string;
  rows: ActivityRowGroup[];
}

/**
 * Bucket collapsed rows into local-calendar days, newest first.
 *
 * Collapsing happens before bucketing but is bounded by the five-minute
 * window, so a run can never straddle a day boundary in practice.
 */
export function buildDaySections(rows: ActivityRowGroup[]): DaySection[] {
  const sections: DaySection[] = [];

  for (const row of rows) {
    const first = row.entries[0];
    if (!first) continue;
    const key = dayKey(first.createdAt);
    const current = sections[sections.length - 1];
    if (current && current.key === key) {
      current.rows.push(row);
      continue;
    }
    sections.push({ key, label: dayLabel(first.createdAt), rows: [row] });
  }

  return sections;
}

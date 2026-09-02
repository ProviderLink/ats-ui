import type {
  ExperienceLevel,
  JobPriority,
  JobStatus,
  JobType,
  LocationType,
  SalaryPeriod,
  SalaryRange,
} from '@/store';

export const jobTypeLabel: Record<JobType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  temporary: 'Temporary',
};

export const locationTypeLabel: Record<LocationType, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

export const experienceLevelLabel: Record<ExperienceLevel, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead',
};

export const jobPriorityLabel: Record<JobPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const jobStatusLabel: Record<JobStatus, string> = {
  open: 'Open',
  draft: 'Draft',
  on_hold: 'On Hold',
  closed: 'Closed',
};

const salaryPeriodLabel: Record<SalaryPeriod, string> = {
  hourly: 'hour',
  daily: 'day',
  weekly: 'week',
  bi_weekly: 'bi-week',
  monthly: 'month',
  yearly: 'year',
};

export function formatSalary(sr: SalaryRange): string {
  const symbol = sr.currency === 'USD' ? '$' : sr.currency;
  const fmt = (n: number) => `${symbol}${n.toLocaleString()}`;
  return `${fmt(sr.min)} – ${fmt(sr.max)} / ${salaryPeriodLabel[sr.period]}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDeadline(deadline: string): {
  text: string;
  destructive: boolean;
} {
  const now = new Date();
  const d = new Date(deadline);
  const diffDays = Math.ceil(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return { text: 'Expired', destructive: true };
  if (diffDays === 0) return { text: 'Due today', destructive: false };
  if (diffDays === 1) return { text: '1 day left', destructive: false };
  return { text: `${diffDays} days left`, destructive: false };
}

/** Split a string array that may contain embedded bullets/commas into chips.
 * Handles raw strings (backend oddity), deduplicates, and strips empties.
 * Also filters out noise entries that are just single digits (bare numbers
 * often remain after splitting a malformed backend payload). */
export function toChips(items: string[] | string | undefined): string[] {
  function clean(raw: string[]): string[] {
    return [
      ...new Set(
        raw
          .map(s => s.trim())
          .filter(s => s.length > 1 || Number.isNaN(Number(s)))
      ),
    ];
  }
  if (!items) return [];
  if (typeof items === 'string') {
    return clean(items.split(/[,•·|;\n]/).filter(Boolean));
  }
  if (!items.length) return [];
  return clean(items.flatMap(item => item.split(/[,•·|;\n]/).filter(Boolean)));
}

/** Split a single string into bullet items. Handles legacy data where a whole
 * list was pasted into one field, using dashes (" - "), bullets, or newlines
 * as separators. Deliberately does NOT split on commas (those belong inside
 * sentences like "invoices, vendor bills, and deposits"). */
export function splitBullets(text: string): string[] {
  return (
    text
      .split(/\n|\r|•|·|;|\||\s+[-–—]\s+/)
      .map(s =>
        s
          .trim()
          .replace(/^[-•·–—]\s*/, '')
          // Strip redundant list numbers ("1.", "2)", "(3)") — the bullet UI
          // already provides the list structure.
          .replace(/^(?:\(\d+\)|\d+[.)])\s*/, '')
          .trim()
      )
      // Drop empty entries and pure-separator lines (e.g. "______", "-----",
      // "***") that are artifacts of pasting from documents.
      .filter(s => s !== '' && /[\p{L}\p{N}]/u.test(s))
  );
}

/** Split an array/string into bullets (mirrors toChips but without commas). */
export function toBullets(items: string[] | string | undefined): string[] {
  function clean(raw: string[]): string[] {
    return [
      ...new Set(
        raw
          .map(s => s.trim())
          .filter(s => s.length > 1 || Number.isNaN(Number(s)))
      ),
    ];
  }
  if (!items) return [];
  if (typeof items === 'string') {
    return clean(splitBullets(items));
  }
  if (!items.length) return [];
  return clean(items.flatMap(item => splitBullets(item)));
}

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

type DateInput = string | null | undefined;

interface MonthBucket {
  date: string;
  month: string;
  count: number;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseDate(raw: DateInput): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/** Counts dates per calendar month for the last `months` months, oldest first. */
export function countByMonth(dates: DateInput[], months: number): MonthBucket[] {
  const now = new Date();
  const buckets: MonthBucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      date: `${monthKey(d)}-01`,
      month: MONTH_SHORT[d.getMonth()],
      count: 0,
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.date.slice(0, 7), i]));
  for (const raw of dates) {
    const d = parseDate(raw);
    if (!d) continue;
    const i = idx.get(monthKey(d));
    if (i !== undefined) buckets[i].count += 1;
  }
  return buckets;
}

/** Percent change of the last 3 months versus the 3 months before them. */
export function pctChange3m(dates: DateInput[]): number {
  const now = new Date();
  const cur3Start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const prev3Start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  let cur = 0;
  let prev = 0;
  for (const raw of dates) {
    const d = parseDate(raw);
    if (!d) continue;
    if (d >= cur3Start) cur += 1;
    else if (d >= prev3Start) prev += 1;
  }
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

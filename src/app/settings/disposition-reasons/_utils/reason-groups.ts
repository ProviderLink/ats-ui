import {
  CATEGORY_LABELS,
  type DispositionReason,
  type DispositionReasonCategory,
} from '@/store/slices/disposition-reasons.store';

export const CATEGORY_COLORS: Record<DispositionReasonCategory, string> = {
  experience_and_qualifications:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  interview_performance:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  availability_and_employment:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  recruiter_or_client_selection:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  candidate_actions:
    'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  permanently_ineligible_reasons:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

/**
 * Filter, then group by category. Matching also covers the category name, so
 * typing "interview" surfaces that whole group rather than only the reasons
 * whose label happens to contain the word.
 */
export function groupReasons(reasons: DispositionReason[], query: string) {
  const q = query.trim().toLowerCase();
  const matches = q
    ? reasons.filter(
        r =>
          r.label.toLowerCase().includes(q) ||
          CATEGORY_LABELS[r.category].toLowerCase().includes(q)
      )
    : reasons;

  const map = new Map<DispositionReasonCategory, DispositionReason[]>();
  for (const r of matches) {
    const list = map.get(r.category) ?? [];
    list.push(r);
    map.set(r.category, list);
  }
  return map;
}

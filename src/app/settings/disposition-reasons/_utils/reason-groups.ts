import {
  CATEGORY_LABELS,
  type DispositionReason,
  type DispositionReasonCategory,
} from '@/store/slices/disposition-reasons.store';

export const CATEGORY_COLORS: Record<DispositionReasonCategory, string> = {
  experience_and_qualifications:
    'border border-blue-300 bg-blue-200 text-blue-800 dark:border-transparent dark:bg-blue-900/30 dark:text-blue-400',
  interview_performance:
    'border border-purple-300 bg-purple-200 text-purple-800 dark:border-transparent dark:bg-purple-900/30 dark:text-purple-400',
  availability_and_employment:
    'border border-amber-300 bg-amber-200 text-amber-800 dark:border-transparent dark:bg-amber-900/30 dark:text-amber-400',
  recruiter_or_client_selection:
    'border border-emerald-300 bg-emerald-200 text-emerald-800 dark:border-transparent dark:bg-emerald-900/30 dark:text-emerald-400',
  candidate_actions:
    'border border-slate-300 bg-slate-200 text-slate-800 dark:border-transparent dark:bg-slate-900/30 dark:text-slate-400',
  permanently_ineligible_reasons:
    'border border-red-300 bg-red-200 text-red-800 dark:border-transparent dark:bg-red-900/30 dark:text-red-400',
  other: 'border border-gray-300 bg-gray-200 text-gray-800 dark:border-transparent dark:bg-gray-900/30 dark:text-gray-400',
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

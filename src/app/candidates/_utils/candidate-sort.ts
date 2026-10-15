
export const CANDIDATE_SORT_OPTIONS = [
  'newest',
  'oldest',
  'a_z',
  'z_a',
  'highest_score',
  'lowest_score',
] as const;

export type CandidateSortOption = (typeof CANDIDATE_SORT_OPTIONS)[number];

export const CANDIDATE_SORT_LABELS: Record<CandidateSortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  a_z: 'Name A → Z',
  z_a: 'Name Z → A',
  highest_score: 'Highest AI score',
  lowest_score: 'Lowest AI score',
};

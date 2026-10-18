import type { Candidate } from '@/store/types';

export function filterIneligible(
  items: Candidate[],
  query: string
): Candidate[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      !!c.email?.toLowerCase().includes(q) ||
      !!c.phone?.toLowerCase().includes(q)
  );
}

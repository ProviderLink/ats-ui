import { getTagId } from '@/lib/tags';
import type { Candidate } from '@/store/types';

/** Candidates in the talent pool matching the search text and tag filter. */
export function filterTalentPool(
  candidates: Candidate[],
  query: string,
  tagFilter: string[]
): Candidate[] {
  let result = candidates.filter(c => c.inTalentPool === true);

  const q = query.trim().toLowerCase();
  if (q) {
    result = result.filter(c => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      if (fullName.includes(q)) return true;
      if (c.email?.toLowerCase().includes(q)) return true;
      if (c.phone?.toLowerCase().includes(q)) return true;
      const skills = (c.parsedData?.skills ?? []).join(' ').toLowerCase();
      if (skills.includes(q)) return true;
      const exp = c.parsedData?.experience?.[0];
      if (exp?.title?.toLowerCase().includes(q)) return true;
      return !!exp?.company?.toLowerCase().includes(q);
    });
  }

  if (tagFilter.length > 0) {
    result = result.filter(c =>
      c.tags?.some(t => {
        const tagId = getTagId(t);
        return !!tagId && tagFilter.includes(tagId);
      })
    );
  }

  return result;
}

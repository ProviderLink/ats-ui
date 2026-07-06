import { useTagStore } from '@/store/slices/tags.store';
import type { RawTag, Tag } from '@/store/types';
import { useMemo } from 'react';

export type { RawTag, Tag };

/** Placeholder used when an ID couldn't be resolved against the tag cache. */
const UNKNOWN_TAG_STUB = (id: string): Tag => ({
  _id: id,
  name: 'Unknown',
  color: '#94a3b8', // slate-400 — neutral, visible in light/dark
  createdAt: '',
  updatedAt: '',
});

/**
 * Convert a raw `tags` array (mix of `string` ObjectIds and/or full `Tag`
 * objects) into a fully-resolved `Tag[]`, using `cache` for ID lookup.
 * Unknown IDs collapse to a neutral stub so a chip is still rendered
 * (better than an invisible one).
 */
export function normalizeTags(
  raw: RawTag[] | null | undefined,
  cache: Tag[]
): Tag[] {
  if (!raw || raw.length === 0) return [];
  const byId = new Map<string, Tag>();
  for (const t of cache) byId.set(t._id, t);
  const out: Tag[] = [];
  for (const r of raw) {
    if (r == null) continue;
    if (typeof r === 'string') {
      out.push(byId.get(r) ?? UNKNOWN_TAG_STUB(r));
    } else {
      out.push(r);
    }
  }
  return out;
}

/**
 * React hook resolving a raw `tags` array against the live Tag store cache.
 * Re-resolves whenever the cache updates (e.g. tags finish loading after the
 * entity list), so chips update automatically instead of staying empty.
 */
export function useResolvedTags(tags: RawTag[] | null | undefined): Tag[] {
  const cache = useTagStore(s => s.items);
  // Re-derive only when inputs or cache contents change, not on every render.
  const cacheKey = cache.map(t => `${t._id}:${t.updatedAt}`).join('|');
  return useMemo(() => normalizeTags(tags, cache), [tags, cacheKey]);
}

/** Extract the stable `_id` from either a raw string ID or a full Tag object. */
export function getTagId(t: RawTag | null | undefined): string | null {
  if (t == null) return null;
  return typeof t === 'string' ? t : t._id;
}

/**
 * Return the set of tag IDs contained in a raw `tags` array, ignoring
 * null/undefined entries. Useful for client-side tag filtering, which
 * previously did `c.tags.some(t => selectedTags.has(t._id))` and silently
 * matched nothing when the backend shipped `string[]` IDs.
 */
export function getTagIds(tags: RawTag[] | null | undefined): string[] {
  if (!tags) return [];
  const ids: string[] = [];
  for (const t of tags) {
    const id = getTagId(t);
    if (id) ids.push(id);
  }
  return ids;
}

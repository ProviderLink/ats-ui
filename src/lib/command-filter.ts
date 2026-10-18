/**
 * `Command` filter that keeps a plain case-insensitive "contains" match on the
 * item's `keywords`, instead of cmdk's fuzzy scoring — so typing "ac" finds
 * "Acme" but never an unrelated name that merely contains those letters apart.
 */
export function keywordFilter(
  _value: string,
  search: string,
  keywords?: string[]
): number {
  const query = search.trim().toLowerCase();
  if (!query) return 1;
  return (keywords ?? []).some(k => k.toLowerCase().includes(query)) ? 1 : 0;
}

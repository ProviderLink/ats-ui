import { useState } from 'react';

/** Row selection by id for list pages with a bulk-action bar. */
export function useIdSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Select every id, or clear when all are already selected. */
  function toggleAll(allIds: string[]) {
    setSelectedIds(prev =>
      prev.size === allIds.length ? new Set() : new Set(allIds)
    );
  }

  function clear() {
    setSelectedIds(new Set());
  }

  return { selectedIds, toggle, toggleAll, clear };
}

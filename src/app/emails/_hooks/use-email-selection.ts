import type { Email } from '@/store/types';
import { useState } from 'react';

export function useEmailSelection(visible: Email[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);

  function toggle(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirmingBulkDelete(false);
  }

  function toggleAll() {
    setSelectedIds(prev =>
      prev.size === visible.length ? new Set() : new Set(visible.map(e => e._id))
    );
    setConfirmingBulkDelete(false);
  }

  function clear() {
    setSelectedIds(new Set());
    setConfirmingBulkDelete(false);
  }

  function remove(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    allSelected: visible.length > 0 && selectedIds.size === visible.length,
    confirmingBulkDelete,
    setConfirmingBulkDelete,
    toggle,
    toggleAll,
    clear,
    remove,
  };
}

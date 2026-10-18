import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { useIdSelection } from '@/hooks/use-id-selection';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { useState } from 'react';

/**
 * Search, tag filter, paging and row selection for a client-filtered candidate
 * list. Any filter change returns to page 0 and drops the selection, so a bulk
 * action can never reach a candidate the user can no longer see.
 */
export function useCandidateListControls(storageKey: string) {
  const selection = useIdSelection();
  const pagination = useTablePagination({ storageKey, defaultSize: 20 });
  const { resetPage } = pagination;
  const { clear } = selection;

  const search = useDebouncedSearch(() => {
    resetPage();
    clear();
  });
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  function changeTagFilter(ids: string[]) {
    setTagFilter(ids);
    resetPage();
    clear();
  }

  return {
    search,
    tagFilter,
    changeTagFilter,
    hasFilters: !!search.query || tagFilter.length > 0,
    pagination,
    selection,
  };
}

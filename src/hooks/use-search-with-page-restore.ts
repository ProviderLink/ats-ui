import { useRef, useState } from 'react';

interface UseSearchWithPageRestoreOptions {
  /** Initial search value (e.g. from persisted store) */
  initialValue?: string;
  /** Current 0-based page index */
  pageIndex: number;
  /** Called to change the page index (0-based) */
  onPageChange: (pageIndex: number) => void;
}

interface UseSearchWithPageRestoreResult {
  /** Current search query string */
  search: string;
  /** Set the search value directly (skip save/restore logic) */
  setSearch: (value: string) => void;
  /** Handle search input changes with save/restore page logic */
  handleSearchChange: (value: string) => void;
}

/**
 * Manages search state with page position save/restore.
 *
 * When search starts: saves current page and resets to page 0.
 * When search clears: restores the previously saved page.
 * When search term changes while already searching: stays at page 0.
 */
export function useSearchWithPageRestore({
  initialValue = '',
  pageIndex,
  onPageChange,
}: UseSearchWithPageRestoreOptions): UseSearchWithPageRestoreResult {
  const [search, setSearch] = useState(initialValue);
  const preSearchPage = useRef<number | null>(null);

  function handleSearchChange(value: string) {
    const wasEmpty = search === '';
    const isNowEmpty = value === '';

    if (wasEmpty && value !== '') {
      // Search starting — save current page and reset to 0
      preSearchPage.current = pageIndex;
      onPageChange(0);
    } else if (isNowEmpty && preSearchPage.current !== null) {
      // Search cleared — restore saved page
      onPageChange(preSearchPage.current);
      preSearchPage.current = null;
    } else if (!wasEmpty && !isNowEmpty) {
      // Search term changed — stay at page 0
      onPageChange(0);
    }

    setSearch(value);
  }

  return { search, setSearch, handleSearchChange };
}

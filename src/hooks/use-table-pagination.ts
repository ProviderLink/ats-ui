import { useCallback, useState } from 'react';

/**
 * Shared table pagination state.
 *
 * All eight list screens previously carried their own copy of the same logic:
 * read a page index from `sessionStorage`, a page size from `localStorage`,
 * validate both, and write them back on change. The copies had drifted —
 * different defaults, a different list of allowed sizes, and two different
 * clamping rules — so this hook is parameterised to reproduce each table's
 * EXISTING behaviour rather than to impose one.
 *
 * Two storage keys are used, matching what the tables already wrote:
 *   sessionStorage `${storageKey}-page-index`  (per-tab: resets with the tab)
 *   localStorage   `${storageKey}-page-size`   (persists across sessions)
 *
 * Deliberately NOT handled here: slicing rows. Some tables slice manually,
 * some delegate to TanStack's `getPaginationRowModel`, and the emails list is
 * paginated server-side. That difference belongs to the table, not to the
 * state container.
 */

/** The set offered by the shared `TablePagination` dropdown. */
export const DEFAULT_PAGE_SIZES = [10, 15, 20, 30, 50] as const;

/**
 * How a requested page size is validated when the user CHANGES it.
 *
 * - `in-list`  — must appear in `validSizes`, else fall back to `defaultSize`.
 * - `positive` — any positive number is accepted, else `defaultSize`.
 *
 * The two exist because this genuinely differed: tags and team used the looser
 * rule, so although 50 is absent from their `validSizes` it is still selectable
 * from the dropdown. That behaviour is preserved.
 */
export type SizeValidation = 'in-list' | 'positive';

export interface UseTablePaginationOptions {
  /** Prefix for the two storage keys, e.g. `clients` or `talent-pool`. */
  storageKey: string;
  /** Used when storage is empty or holds a value that fails validation. */
  defaultSize: number;
  /** Sizes accepted when RESTORING the stored size. Defaults to `DEFAULT_PAGE_SIZES`. */
  validSizes?: readonly number[];
  /** Defaults to `'in-list'`. */
  sizeValidation?: SizeValidation;
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface UseTablePaginationResult {
  pageIndex: number;
  pageSize: number;
  /** Coerce, store and apply a page index. */
  setPageIndex: (index: number) => void;
  /** Coerce, store and apply a page size, returning to page 0. */
  setPageSize: (size: number) => void;
  /**
   * `onPaginationChange`-compatible handler for TanStack's `useReactTable`,
   * accepting either the next state or an updater function.
   */
  handlePaginationChange: (
    updater: PaginationState | ((prev: PaginationState) => PaginationState)
  ) => void;
  /** Return to page 0 and persist. For search/filter/tab changes. */
  resetPage: () => void;
}

function readInt(storage: Storage, key: string): number {
  try {
    return parseInt(storage.getItem(key) ?? '', 10);
  } catch {
    // Storage can throw in private mode or when disabled.
    return Number.NaN;
  }
}

function write(storage: Storage, key: string, value: number): void {
  try {
    storage.setItem(key, String(value));
  } catch {
    // Non-fatal: the in-memory state still updated.
  }
}

export function useTablePagination({
  storageKey,
  defaultSize,
  validSizes = DEFAULT_PAGE_SIZES,
  sizeValidation = 'in-list',
}: UseTablePaginationOptions): UseTablePaginationResult {
  const indexKey = `${storageKey}-page-index`;
  const sizeKey = `${storageKey}-page-size`;

  const [pageIndex, setPageIndexState] = useState(() => {
    const raw = readInt(sessionStorage, indexKey);
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
  });

  const [pageSize, setPageSizeState] = useState(() => {
    const raw = readInt(localStorage, sizeKey);
    return validSizes.includes(raw) ? raw : defaultSize;
  });

  const isValidSize = useCallback(
    (size: number) =>
      sizeValidation === 'positive'
        ? size > 0
        : validSizes.includes(size),
    [sizeValidation, validSizes]
  );

  const setPageIndex = useCallback(
    (index: number) => {
      const safe = Number.isFinite(index) && index >= 0 ? index : 0;
      write(sessionStorage, indexKey, safe);
      setPageIndexState(safe);
    },
    [indexKey]
  );

  const setPageSize = useCallback(
    (size: number) => {
      const safe = isValidSize(size) ? size : defaultSize;
      write(localStorage, sizeKey, safe);
      // Selecting a page size always returns to the first page — a larger size
      // can leave the current index beyond the last page.
      write(sessionStorage, indexKey, 0);
      setPageSizeState(safe);
      setPageIndexState(0);
    },
    [defaultSize, indexKey, isValidSize, sizeKey]
  );

  const handlePaginationChange = useCallback(
    (
      updater: PaginationState | ((prev: PaginationState) => PaginationState)
    ) => {
      const prev = { pageIndex, pageSize };
      const next = typeof updater === 'function' ? updater(prev) : updater;

      const safeIndex =
        Number.isFinite(next.pageIndex) && next.pageIndex >= 0
          ? next.pageIndex
          : 0;
      const safeSize = isValidSize(next.pageSize) ? next.pageSize : defaultSize;

      write(sessionStorage, indexKey, safeIndex);
      write(localStorage, sizeKey, safeSize);
      setPageIndexState(safeIndex);
      setPageSizeState(safeSize);
    },
    [defaultSize, indexKey, isValidSize, pageIndex, pageSize, sizeKey]
  );

  const resetPage = useCallback(() => {
    write(sessionStorage, indexKey, 0);
    setPageIndexState(0);
  }, [indexKey]);

  return {
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
    handlePaginationChange,
    resetPage,
  };
}

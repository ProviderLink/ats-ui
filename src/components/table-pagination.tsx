import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type Table } from '@tanstack/react-table';
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { useMemo } from 'react';

interface TablePaginationProps<TData> {
  table?: Table<TData>;
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  label?: string;
  compact?: boolean;
  /** Controlled mode: called when rows-per-page changes. Required when table is not provided. */
  onPageSizeChange?: (size: number) => void;
  /** Controlled mode: called when page changes. Required when table is not provided. */
  onPageChange?: (index: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 15, 20, 30, 50];

function usePageList(pageIndex: number, pageCount: number) {
  return useMemo(() => {
    const items: (number | '...')[] = [];
    if (pageCount <= 5) {
      for (let i = 0; i < pageCount; i++) items.push(i);
    } else {
      items.push(0);
      if (pageIndex > 2) items.push('...');
      const start = Math.max(1, pageIndex - 1);
      const end = Math.min(pageCount - 2, pageIndex + 1);
      for (let i = start; i <= end; i++) items.push(i);
      if (pageIndex < pageCount - 3) items.push('...');
      items.push(pageCount - 1);
    }
    return items;
  }, [pageIndex, pageCount]);
}

export function TablePagination<TData>({
  table,
  pageIndex,
  pageSize,
  totalRows,
  label = 'rows',
  compact = false,
  onPageSizeChange,
  onPageChange,
}: TablePaginationProps<TData>) {
  const safePageSize = PAGE_SIZE_OPTIONS.includes(pageSize)
    ? pageSize
    : PAGE_SIZE_OPTIONS[0];
  const pageCount = Math.max(1, Math.ceil(totalRows / safePageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const from = totalRows === 0 ? 0 : safePageIndex * safePageSize + 1;
  const to = Math.min((safePageIndex + 1) * safePageSize, totalRows);
  const pages = usePageList(safePageIndex, pageCount);

  function goToPage(idx: number) {
    if (onPageChange) {
      onPageChange(idx);
    } else {
      table?.setPageIndex(idx);
    }
  }

  function handlePageSizeChange(v: string) {
    const size = Number(v);
    if (onPageSizeChange) {
      onPageSizeChange(size);
    } else {
      table?.setPageSize(size);
    }
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
        <span className="text-muted-foreground tabular-nums">
          {totalRows === 0 ? '0' : `${from}–${to}`}
          <span className="mx-1">/</span>
          {totalRows} {label}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => goToPage(0)}
            disabled={safePageIndex === 0}
          >
            <ChevronFirstIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => goToPage(safePageIndex - 1)}
            disabled={safePageIndex === 0}
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => goToPage(safePageIndex + 1)}
            disabled={safePageIndex >= pageCount - 1}
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => goToPage(pageCount - 1)}
            disabled={safePageIndex >= pageCount - 1}
          >
            <ChevronLastIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows per page</span>
          <Select
            value={String(safePageSize)}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger size="sm" className="h-7 w-16">
              <SelectValue placeholder={String(safePageSize)} />
            </SelectTrigger>
            <SelectContent side="top">
              {PAGE_SIZE_OPTIONS.map(n => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-muted-foreground">
          {from}–{to} of {totalRows} {label}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => goToPage(0)}
          disabled={safePageIndex === 0}
        >
          <ChevronFirstIcon className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => goToPage(safePageIndex - 1)}
          disabled={safePageIndex === 0}
        >
          <ChevronLeftIcon className="size-3.5" />
        </Button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === safePageIndex ? 'default' : 'outline'}
              size="icon-xs"
              onClick={() => goToPage(p as number)}
              className={cn(p === safePageIndex && 'pointer-events-none')}
            >
              {(p as number) + 1}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => goToPage(safePageIndex + 1)}
          disabled={safePageIndex >= pageCount - 1}
        >
          <ChevronRightIcon className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => goToPage(pageCount - 1)}
          disabled={safePageIndex >= pageCount - 1}
        >
          <ChevronLastIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

import { TableSkeleton } from '@/components/candidate-table/table-skeleton';
import { TablePagination } from '@/components/table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';

interface CandidateListTableProps {
  table: TanstackTable<Candidate>;
  showSkeleton: boolean;
  totalRows: number;
  emptyMessage: string;
  onRowClick: (candidate: Candidate) => void;
  /** Columns whose cells may wrap onto several lines. */
  wrapColumnIds?: string[];
}

export function CandidateListTable({
  table,
  showSkeleton,
  totalRows,
  emptyMessage,
  onRowClick,
  wrapColumnIds = [],
}: CandidateListTableProps) {
  // TanStack keeps one stable `table` object whose row model changes in place.
  // React Compiler would cache `getRowModel()` against that object and never
  // see rows added or removed, so opt this component out.
  'use no memo';
  const { pageIndex, pageSize } = table.getState().pagination;
  const colCount = table.getAllColumns().length;
  const rows = table.getRowModel().rows;

  return (
    <div className="rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-foreground/5 dark:bg-muted">
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} className="border-b hover:bg-transparent">
                {hg.headers.map(h => (
                  <TableHead key={h.id} className="h-10 px-4">
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              <TableSkeleton cols={colCount} />
            ) : rows.length > 0 ? (
              rows.map(row => (
                <TableRow
                  key={row.id}
                  className="border-b last:border-0 hover:bg-foreground/4 dark:hover:bg-white/3 cursor-pointer"
                  onClick={() => onRowClick(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'px-4 py-3',
                        wrapColumnIds.includes(cell.column.id) &&
                          'whitespace-normal'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="border-t px-2 py-2 shrink-0 bg-background">
        <TablePagination
          table={table}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRows={totalRows}
          label="candidates"
        />
      </div>
    </div>
  );
}

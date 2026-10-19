import { TablePagination } from '@/components/table-pagination';
import { TableSkeleton } from '@/components/candidate-table/table-skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import { flexRender, type Table as ReactTable } from '@tanstack/react-table';

interface CandidatesDataTableProps {
  table: ReactTable<Candidate>;
  columnCount: number;
  loading: boolean;
  rowCount: number;
  openStageRowId: string | null;
  onRowClick: (candidate: Candidate) => void;
  pageIndex: number;
  pageSize: number;
  totalRows: number;
}

export function CandidatesDataTable({
  table,
  columnCount,
  loading,
  rowCount,
  openStageRowId,
  onRowClick: openDetail,
  pageIndex,
  pageSize,
  totalRows,
}: CandidatesDataTableProps) {
  // TanStack keeps one stable `table` object whose row model changes in place.
  // React Compiler would cache `getRowModel()` against that object and never
  // see rows added or removed, so opt this component out.
  'use no memo';
  return (
    <div className="relative rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-10 bg-background/40 opacity-0 transition-opacity duration-150 dark:bg-background/60',
          openStageRowId && 'opacity-100'
        )}
      />
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-foreground/5 dark:bg-muted">
            {table.getHeaderGroups().map(hg => (
              <TableRow
                key={hg.id}
                className="border-b hover:bg-transparent"
              >
                {hg.headers.map(h => (
                  <TableHead key={h.id} className="h-10 px-4">
                    {h.isPlaceholder
                      ? null
                      : flexRender(
                          h.column.columnDef.header,
                          h.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading && rowCount === 0 ? (
              <TableSkeleton cols={columnCount} />
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className={cn(
                    'border-b last:border-0 hover:bg-foreground/4 dark:hover:bg-white/3 cursor-pointer has-aria-expanded:bg-transparent',
                    openStageRowId === row.original._id &&
                      'relative z-20 bg-background/90'
                  )}
                  onClick={() => openDetail(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No candidates found.
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

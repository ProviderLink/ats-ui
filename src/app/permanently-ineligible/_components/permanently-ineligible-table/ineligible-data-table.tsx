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
import type { Candidate } from '@/store/types';
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';

interface IneligibleDataTableProps {
  table: TanstackTable<Candidate>;
  showSkeleton: boolean;
  hasFilters: boolean;
  totalRows: number;
  onRowClick: (candidate: Candidate) => void;
}

export function IneligibleDataTable({
  table,
  showSkeleton,
  hasFilters,
  totalRows,
  onRowClick,
}: IneligibleDataTableProps) {
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
                  className="border-b last:border-0 cursor-pointer"
                  onClick={() => onRowClick(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="px-4 py-3">
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
                  {hasFilters
                    ? 'No candidates match your search.'
                    : 'No permanently ineligible candidates.'}
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

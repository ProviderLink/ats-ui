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
import type { Client } from '@/store/types';
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';

interface ClientsDataTableProps {
  table: TanstackTable<Client>;
  showSkeleton: boolean;
  isRefreshing: boolean;
  totalRows: number;
  onRowClick: (client: Client) => void;
  onPageChange: (index: number) => void;
  onPageSizeChange: (size: number) => void;
}

const COLUMN_COUNT = 8;

export function ClientsDataTable({
  table,
  showSkeleton,
  isRefreshing,
  totalRows,
  onRowClick,
  onPageChange,
  onPageSizeChange,
}: ClientsDataTableProps) {
  // TanStack keeps one stable `table` object whose row model changes in place.
  // React Compiler would cache `getRowModel()` against that object and never
  // see rows added or removed, so opt this component out.
  'use no memo';
  const { pageIndex, pageSize } = table.getState().pagination;
  const rows = table.getRowModel().rows;

  return (
    <div className="rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-foreground/[0.05] dark:bg-muted">
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
          {isRefreshing && (
            <div className="h-px bg-muted overflow-hidden">
              <div className="h-full w-1/3 bg-primary/40 animate-pulse rounded-full" />
            </div>
          )}
          <TableBody>
            {showSkeleton ? (
              <TableSkeleton cols={COLUMN_COUNT} />
            ) : rows.length > 0 ? (
              rows.map(row => (
                <TableRow
                  key={row.id}
                  className="border-b last:border-0 hover:bg-foreground/[0.04] dark:hover:bg-white/3 cursor-pointer"
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
                  colSpan={COLUMN_COUNT}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No clients found.
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
          label="clients"
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}

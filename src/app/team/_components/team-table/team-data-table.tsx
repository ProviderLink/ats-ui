import { TablePagination } from '@/components/table-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { User } from '@/store/types/user.types';
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';
import { baseColumns } from '../team-columns';

interface TeamDataTableProps {
  table: TanstackTable<User>;
  showSkeleton: boolean;
  totalRows: number;
}

export function TeamDataTable({
  table,
  showSkeleton,
  totalRows,
}: TeamDataTableProps) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const rows = table.getRowModel().rows;

  return (
    <div className="rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-foreground/[0.05] dark:bg-muted">
            {table.getHeaderGroups().map(hg => (
              <TableRow
                key={hg.id}
                className="border-b hover:bg-transparent divide-x divide-border"
              >
                {hg.headers.map(h => (
                  <TableHead
                    key={h.id}
                    style={
                      h.column.getSize() !== 150
                        ? { width: h.column.getSize() }
                        : undefined
                    }
                    className={cn(
                      'h-10 px-4',
                      h.column.id === 'select' && 'px-4 text-center'
                    )}
                  >
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
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-b divide-x divide-border">
                  {baseColumns.map(c => (
                    <TableCell key={c.id} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className="border-b last:border-0 divide-x divide-border hover:bg-muted/30 data-[state=selected]:bg-accent/40"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'px-4 py-3',
                        cell.column.id === 'select' && 'px-4 text-center'
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
                  colSpan={table.getAllColumns().length}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No team members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="border-t shrink-0 bg-background">
        <TablePagination
          table={table}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRows={totalRows}
          label="members"
        />
      </div>
    </div>
  );
}

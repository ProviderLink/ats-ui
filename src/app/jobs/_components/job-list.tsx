import { TablePagination } from '@/components/table-pagination';
import { useTablePagination } from '@/hooks/use-table-pagination';
import type { Client, Job, JobFilters, JobStatus } from '@/store';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useJobCandidateCounts } from '../_hooks/use-job-candidate-counts';
import { filterJobs } from '../_utils/job-list';
import { JobListHeader } from './job-list/job-list-header';
import { JobListItem } from './job-list/job-list-item';
import { JobListSkeleton } from './job-list/job-list-skeleton';
import { JobStatusFilter } from './job-list/job-status-filter';
import { NewJobSheet } from './new-job-sheet';

interface JobListProps {
  jobs: Job[];
  clients: Client[];
  loading: boolean;
  isRefreshing: boolean;
  filters: JobFilters;
  onFiltersChange: (f: Partial<JobFilters>) => void;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function JobList({
  jobs,
  clients,
  loading,
  isRefreshing,
  filters,
  onFiltersChange,
  selectedId,
  onSelect,
}: JobListProps) {
  const [query, setQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [addOpen, setAddOpen] = useState(
    () => searchParams.get('action') === 'new'
  );
  const candidateCountByJob = useJobCandidateCounts();
  const { pageIndex, pageSize, handlePaginationChange, setPageIndex, resetPage } =
    useTablePagination({
      storageKey: 'jobs',
      defaultSize: 10,
      sizeValidation: 'positive',
    });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setAddOpen(true);
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.delete('action');
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  const clientMap = useMemo(
    () => Object.fromEntries((clients ?? []).map(c => [c._id, c.companyName])),
    [clients]
  );

  const filtered = useMemo(
    () => filterJobs(jobs ?? [], filters, query, clientMap),
    [jobs, filters, query, clientMap]
  );

  // Clamp pageIndex if data or filters reduce available pages
  useEffect(() => {
    if (filtered.length === 0) return;
    const pageCount = Math.ceil(filtered.length / pageSize);
    if (pageIndex >= pageCount) setPageIndex(Math.max(0, pageCount - 1));
  }, [filtered.length, pageSize, pageIndex, setPageIndex]);

  const table = useReactTable({
    data: filtered,
    columns: [],
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const paginated = table.getRowModel().rows.map(r => r.original);

  return (
    <>
      <div className="w-72 md:w-96 shrink-0 border-r border-t flex flex-col overflow-hidden">
        <JobListHeader
          count={filtered.length}
          query={query}
          onQueryChange={q => {
            setQuery(q);
            resetPage();
          }}
          onAdd={() => setAddOpen(true)}
        />

        <JobStatusFilter
          status={filters.status}
          onChange={(status: JobStatus | undefined) =>
            onFiltersChange({ status, page: 1 })
          }
        />

        <div className="flex-1 overflow-y-auto">
          {isRefreshing && (
            <div className="h-px bg-muted overflow-hidden">
              <div className="h-full w-1/3 bg-primary/40 animate-pulse rounded-full" />
            </div>
          )}
          {loading && jobs.length === 0 ? (
            <JobListSkeleton />
          ) : paginated.length === 0 ? (
            <p className="px-4 py-6 text-xs text-center text-muted-foreground">
              No jobs found.
            </p>
          ) : (
            paginated.map(job => (
              <JobListItem
                key={job._id}
                job={job}
                clientName={clientMap[job.clientId]}
                candidateCount={candidateCountByJob.get(job._id) ?? 0}
                selected={selectedId === job._id}
                onSelect={() => onSelect(job._id)}
              />
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <div className="border-t shrink-0 bg-background">
            <TablePagination
              table={table}
              pageIndex={pageIndex}
              pageSize={pageSize}
              totalRows={filtered.length}
              label="jobs"
              compact
            />
          </div>
        )}
      </div>

      <NewJobSheet open={addOpen} onOpenChange={setAddOpen} clients={clients} />
    </>
  );
}

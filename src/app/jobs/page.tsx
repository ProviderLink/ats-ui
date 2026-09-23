import { useSocketRoom } from '@/hooks/use-socket-room';
import { getJson } from '@/lib/api-client';
import { sortableTime } from '@/lib/utils';
import type { Client, Job, Pagination } from '@/store';
import { useJobStore } from '@/store';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { JobList } from './_components/job-list';
import { JobPanel } from './_components/job-panel';

const EMPTY_JOBS: Job[] = [];
const EMPTY_CLIENTS: Client[] = [];

// Default sort weight: open jobs first, then drafts/holds, closed last.
const STATUS_RANK: Record<string, number> = {
  open: 0,
  draft: 1,
  on_hold: 2,
  closed: 3,
};

function compareJobs(a: Job, b: Job) {
  const rankA = STATUS_RANK[a.status] ?? 99;
  const rankB = STATUS_RANK[b.status] ?? 99;
  if (rankA !== rankB) return rankA - rankB;
  // Within the same status, newer jobs (createdAt desc) come first.
  // `sortableTime` guards against an unparseable `createdAt`, which would
  // otherwise yield NaN and leave the order implementation-defined.
  const tA = sortableTime(a.createdAt);
  const tB = sortableTime(b.createdAt);
  if (tB !== tA) return tB - tA;
  return (b._id ?? '').localeCompare(a._id ?? '');
}

async function fetchAllClients(): Promise<Client[]> {
  // Fetch clients directly without going through the shared client store, so
  // the jobs page never mutates the client store's filters/pagination and
  // breaks the clients page state on return.
  const res = await getJson<Client[] | ({ data: Client[] } & Pagination)>(
    '/ats/clients',
    { limit: 9999 }
  );
  return Array.isArray(res) ? res : (res.data ?? []);
}

function JobsPageContent() {
  const [searchParams] = useSearchParams();
  const jobParam = searchParams.get('job') ?? '';
  const clientParam = searchParams.get('client') ?? '';

  useSocketRoom('jobs');

  const {
    items: jobItems,
    loading,
    isRefreshing,
    filters,
    fetch,
    setFilters,
  } = useJobStore();
  const [clientItems, setClientItems] = useState<Client[]>(EMPTY_CLIENTS);
  const rawJobs = jobItems ?? EMPTY_JOBS;
  const clients = clientItems ?? EMPTY_CLIENTS;
  const jobs = useMemo(() => [...rawJobs].sort(compareJobs), [rawJobs]);

  useEffect(() => {
    // Fetch all jobs so the client-side default sort (open first, newest
    // first) is applied across the full dataset, not just the first page.
    void fetch({ limit: 9999 });
    // Fetch all clients locally (see fetchAllClients comment).
    void fetchAllClients()
      .then(setClientItems)
      .catch(() => undefined);
  }, []);

  // Deep-link: `?client=<companyName>` (from the clients table "view jobs"
  // action) should filter the list to that client's jobs. Resolve the company
  // name to a clientId once clients are loaded, then apply the filter. When
  // the param is absent, clear any stale clientId filter so a plain visit to
  // /jobs shows all jobs.
  useEffect(() => {
    if (!clientParam) {
      if (filters.clientId) {
        setFilters({ clientId: undefined, page: 1 });
        void fetch({ page: 1, limit: 9999 });
      }
      return;
    }
    const match = clients.find(
      c => c.companyName.toLowerCase() === clientParam.toLowerCase()
    );
    if (!match || filters.clientId === match._id) return;
    setFilters({ clientId: match._id, page: 1 });
    void fetch({ clientId: match._id, page: 1, limit: 9999 });
  }, [clientParam, clients, filters.clientId, setFilters, fetch]);

  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    // Deep-link from `?job=<id>` takes precedence when valid.
    if (jobParam && jobs?.find(j => j._id === jobParam)) {
      if (selectedId !== jobParam) setSelectedId(jobParam);
      return;
    }
    // If the current selection no longer exists (deleted server-side or via
    // the panel), fall back to the first available job so the detail panel
    // never lingers on a stale id.
    if (jobs?.length > 0) {
      if (!selectedId || !jobs.find(j => j._id === selectedId)) {
        setSelectedId(jobs[0]._id);
      }
    }
  }, [jobs, jobParam, selectedId]);

  const selected = jobs?.find(j => j._id === selectedId) ?? null;

  return (
    <div className="flex flex-1 overflow-hidden">
      <JobList
        jobs={jobs}
        clients={clients}
        loading={loading}
        isRefreshing={isRefreshing}
        filters={filters}
        onFiltersChange={f => {
          setFilters(f);
          void fetch(f);
        }}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <JobPanel job={selected} clients={clients} />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense>
      <JobsPageContent />
    </Suspense>
  );
}

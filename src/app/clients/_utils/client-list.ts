import type { Client, ClientStatus, Job } from '@/store/types';

export const VALID_SORT_OPTIONS = [
  'default',
  'newest',
  'oldest',
  'mostJobs',
  'leastJobs',
  'mostOpenJobs',
  'leastOpenJobs',
] as const;

export type SortOption = (typeof VALID_SORT_OPTIONS)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  default: 'Default',
  newest: 'Newest first',
  oldest: 'Oldest first',
  mostJobs: 'Most jobs',
  leastJobs: 'Least jobs',
  mostOpenJobs: 'Most open jobs',
  leastOpenJobs: 'Least open jobs',
};

export type JobCounts = Map<string, { total: number; open: number }>;

export function countJobsByClient(jobs: Job[]): JobCounts {
  const map: JobCounts = new Map();
  for (const job of jobs) {
    const entry = map.get(job.clientId) ?? { total: 0, open: 0 };
    entry.total++;
    if (job.status === 'open') entry.open++;
    map.set(job.clientId, entry);
  }
  return map;
}

export function sortClients(
  clients: Client[],
  counts: JobCounts,
  sortBy: SortOption
): Client[] {
  return [...clients].sort((a, b) => {
    const aOpen = counts.get(a._id)?.open ?? 0;
    const bOpen = counts.get(b._id)?.open ?? 0;
    const aTotal = counts.get(a._id)?.total ?? 0;
    const bTotal = counts.get(b._id)?.total ?? 0;
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();

    switch (sortBy) {
      case 'newest':
        return bTime - aTime;
      case 'oldest':
        return aTime - bTime;
      case 'mostJobs':
        if (bTotal !== aTotal) return bTotal - aTotal;
        return bTime - aTime;
      case 'leastJobs':
        if (aTotal !== bTotal) return aTotal - bTotal;
        return bTime - aTime;
      case 'mostOpenJobs':
        if (bOpen !== aOpen) return bOpen - aOpen;
        return bTime - aTime;
      case 'leastOpenJobs':
        if (aOpen !== bOpen) return aOpen - bOpen;
        return bTime - aTime;
      default:
        if (bOpen !== aOpen) return bOpen - aOpen;
        if (bTotal !== aTotal) return bTotal - aTotal;
        return bTime - aTime;
    }
  });
}

export function filterClients(
  clients: Client[],
  status: ClientStatus | 'all',
  query: string
): Client[] {
  const byStatus =
    status === 'all' ? clients : clients.filter(c => c.status === status);
  const q = query.trim().toLowerCase();
  if (!q) return byStatus;
  return byStatus.filter(client => {
    if (client.companyName.toLowerCase().includes(q)) return true;
    if (client.industry?.toLowerCase().includes(q)) return true;
    if (
      client.contacts.some(
        c =>
          c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      )
    )
      return true;
    return !!client.tags?.some(tag => {
      const name =
        typeof tag === 'object' && tag !== null
          ? (tag as { name?: string }).name
          : '';
      return name?.toLowerCase().includes(q);
    });
  });
}

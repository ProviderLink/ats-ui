import type { Job, JobFilters, JobPriority } from '@/store';

export function filterJobs(
  jobs: Job[],
  filters: Pick<JobFilters, 'status' | 'clientId'> & {
    priority?: JobPriority;
  },
  query: string,
  clientNames: Record<string, string>
): Job[] {
  let list = jobs;
  if (filters.status) list = list.filter(j => j.status === filters.status);
  if (filters.priority)
    list = list.filter(j => j.priority === filters.priority);
  if (filters.clientId)
    list = list.filter(j => j.clientId === filters.clientId);
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        (clientNames[j.clientId] ?? '').toLowerCase().includes(q)
    );
  }
  return list;
}

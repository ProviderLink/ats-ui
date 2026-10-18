import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useEffect, useMemo } from 'react';

/**
 * Jobs and clients, loaded on demand, plus the open jobs shaped for the
 * "assign to job" dialog (client name and active stages included).
 */
export function useAssignableJobs() {
  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const clients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);

  useEffect(() => {
    if (jobs.length === 0) fetchJobs({ page: 1, limit: 9999 });
  }, [jobs.length, fetchJobs]);

  useEffect(() => {
    if (clients.length === 0) fetchClients({ page: 1, limit: 9999 });
  }, [clients.length, fetchClients]);

  const openJobs = useMemo(() => {
    const clientMap = new Map(clients.map(c => [c._id, c.companyName]));
    return jobs
      .filter(j => j.status === 'open')
      .map(j => ({
        _id: j._id,
        title: j.title,
        clientName: clientMap.get(j.clientId) ?? '',
        stages: (j.pipeline?.stages ?? [])
          .filter(s => s.isActive)
          .sort((a, b) => a.order - b.order)
          .map(s => ({ _id: s._id, name: s.name })),
      }));
  }, [jobs, clients]);

  return { jobs, clients, openJobs };
}

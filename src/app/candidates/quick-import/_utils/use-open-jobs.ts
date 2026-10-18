import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useEffect, useMemo } from 'react';
import type { JobOption } from './quick-import-form';

/**
 * Open jobs with their client names. A preset job (e.g. linked from /jobs)
 * that is not in the cached open list yet is still included, so the picker
 * never shows an empty selection.
 */
export function useOpenJobs(presetJobId: string) {
  const allJobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const clients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);

  useEffect(() => {
    void fetchJobs({ status: 'open', limit: 9999 });
    if (clients.length === 0) fetchClients({ limit: 9999 });
  }, [fetchJobs, fetchClients, clients.length]);

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map(c => [c._id, c.companyName])),
    [clients]
  );

  const openJobs = useMemo<JobOption[]>(() => {
    const open = allJobs
      .filter(j => j.status === 'open')
      .map(j => ({
        _id: j._id,
        title: j.title,
        clientName: clientMap[j.clientId] ?? j.clientId,
      }));
    if (!presetJobId || open.some(j => j._id === presetJobId)) return open;
    const preset = allJobs.find(j => j._id === presetJobId);
    if (!preset) return open;
    return [
      ...open,
      {
        _id: preset._id,
        title: preset.title,
        clientName: clientMap[preset.clientId] ?? preset.clientId,
      },
    ];
  }, [allJobs, clientMap, presetJobId]);

  return { allJobs, openJobs };
}

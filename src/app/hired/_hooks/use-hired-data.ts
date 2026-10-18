import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useTagStore } from '@/store/slices/tags.store';
import type { Application } from '@/store/types';
import { useEffect, useMemo, useState } from 'react';
import { buildHireInfo, buildOtherActivity } from '../_utils/hired-data';

/** Loads and derives everything the Hired list needs. */
export function useHiredData() {
  const items = useCandidateStore(s => s.items);
  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);
  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const clients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);
  const applications = useApplicationStore(s => s.items);
  const fetchAppsScoped = useApplicationStore(s => s.fetchScoped);

  useEffect(() => {
    if (allTags.length === 0) fetchTags();
  }, [allTags.length, fetchTags]);

  useEffect(() => {
    if (jobs.length === 0) fetchJobs({ page: 1, limit: 9999 });
  }, [jobs.length, fetchJobs]);

  useEffect(() => {
    if (clients.length === 0) fetchClients({ page: 1, limit: 9999 });
  }, [clients.length, fetchClients]);

  // The Hired list is application-derived, so it needs the full dataset.
  // Other screens issue filtered fetches; this page takes its own unfiltered
  // copy so it never renders empty because of what another page loaded.
  const [scopedApps, setScopedApps] = useState<Application[]>([]);
  useEffect(() => {
    let alive = true;
    fetchAppsScoped({ limit: 9999 })
      .then(rows => {
        if (alive) setScopedApps(rows);
      })
      .catch(() => {
        if (alive) setScopedApps([]);
      });
    return () => {
      alive = false;
    };
  }, [fetchAppsScoped]);

  const apps = scopedApps.length > 0 ? scopedApps : applications;

  const hireInfoByCandidateId = useMemo(
    () => buildHireInfo(apps, jobs, clients),
    [apps, jobs, clients]
  );
  const otherActivityByCandidateId = useMemo(
    () => buildOtherActivity(apps, items),
    [apps, items]
  );

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

  async function refreshApps() {
    setScopedApps(await fetchAppsScoped({ limit: 9999 }));
  }

  return {
    candidates: items,
    allTags,
    hireInfoByCandidateId,
    otherActivityByCandidateId,
    openJobs,
    refreshApps,
  };
}

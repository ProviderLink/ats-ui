import { useAssignableJobs } from '@/hooks/use-assignable-jobs';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useTagStore } from '@/store/slices/tags.store';
import type { Application } from '@/store/types';
import { useEffect, useMemo, useState } from 'react';
import { buildHireInfo, buildOtherActivity } from '../_utils/hired-data';

/** Loads and derives everything the Hired list needs. */
export function useHiredData() {
  const items = useCandidateStore(s => s.items);
  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);
  const { jobs, clients, openJobs } = useAssignableJobs();
  const applications = useApplicationStore(s => s.items);
  const fetchAppsScoped = useApplicationStore(s => s.fetchScoped);

  useEffect(() => {
    if (allTags.length === 0) fetchTags();
  }, [allTags.length, fetchTags]);

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

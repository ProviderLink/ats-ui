import type { ActivityContext } from '@/lib/activity-sentence';
import { useJobStore } from '@/store/slices/jobs.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import { useMemo } from 'react';

/** Lookups the sentences use to name a job or print an interview time. */
export function useActivityContext(): ActivityContext {
  const jobs = useJobStore(s => s.items);
  const companyTimezone = useSettingsStore(s => s.settings?.companyTimezone);
  return useMemo(() => {
    const titles = new Map(jobs.map(j => [j._id, j.title]));
    return { jobTitle: id => titles.get(id) ?? null, timeZone: companyTimezone };
  }, [jobs, companyTimezone]);
}

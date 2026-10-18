import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useApplicationStore, useJobStore } from '@/store';
import { CheckCircleIcon, UserIcon, UsersIcon } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, jobStatusConfig } from './config';
import { SectionTitle } from './primitives';

export function JobsTab({ clientId }: { clientId: string }) {
  const navigate = useNavigate();
  const jobs = useJobStore(s => s.items);
  const apps = useApplicationStore(s => s.items);
  const fetchAppsMerge = useApplicationStore(s => s.fetchScopedMerge);
  const clientJobs = jobs.filter(j => j.clientId === clientId);

  useEffect(() => {
    // Merge this client's applications into the shared list instead of
    // replacing it, so jobs/app counts stay correct without emptying screens
    // that read the full dataset.
    void fetchAppsMerge({ clientId, limit: 9999 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const appCountsByJob = useMemo(() => {
    const map = new Map<string, { total: number; approved: number }>();
    for (const a of apps) {
      const entry = map.get(a.jobId) ?? { total: 0, approved: 0 };
      entry.total++;
      if (a.phase === 'approved' || a.phase === 'hired') entry.approved++;
      map.set(a.jobId, entry);
    }
    return map;
  }, [apps]);

  if (clientJobs.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No jobs found for this client.
      </div>
    );
  }

  const open = clientJobs.filter(j => j.status === 'open');
  const other = clientJobs.filter(j => j.status !== 'open');

  return (
    <div className="flex flex-col gap-3 py-5">
      <p className="text-xs text-muted-foreground">
        {clientJobs.length} {clientJobs.length === 1 ? 'job' : 'jobs'} total ·{' '}
        {open.length} open
      </p>
      {open.length > 0 && (
        <>
          <SectionTitle>Active</SectionTitle>
          {open.map(j => {
            const cfg = jobStatusConfig[j.status] ?? jobStatusConfig.draft;
            const counts = appCountsByJob.get(j._id);
            return (
              <div
                key={j._id}
                className="rounded-lg border bg-card p-4 flex flex-col gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/ats/jobs?job=${j._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ')
                    navigate(`/ats/jobs?job=${j._id}`);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">
                      {j.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {j.jobType.replace('_', ' ')} · {j.locationType}
                      {j.openings > 1 && ` · ${j.openings} openings`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 text-xs bg-transparent', cfg.cls)}
                  >
                    {cfg.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
                  <span className="flex items-center gap-1">
                    <UsersIcon className="size-3.5" />
                    {j.openings} opening{j.openings !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="size-3.5" />
                    {counts?.total ?? 0} candidate
                    {counts?.total !== 1 ? 's' : ''}
                  </span>
                  {(counts?.approved ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-pine-teal-700 dark:text-pine-teal-400">
                      <CheckCircleIcon className="size-3.5" />
                      {counts!.approved} approved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
      {other.length > 0 && (
        <>
          {open.length > 0 && <Separator />}
          <SectionTitle>Other</SectionTitle>
          {other.map(j => {
            const cfg = jobStatusConfig[j.status] ?? jobStatusConfig.draft;
            const counts = appCountsByJob.get(j._id);
            return (
              <div
                key={j._id}
                className="rounded-lg border bg-card p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/ats/jobs?job=${j._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ')
                    navigate(`/ats/jobs?job=${j._id}`);
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{j.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {j.startDate
                      ? formatDate(j.startDate)
                      : formatDate(j.createdAt)}
                    {(counts?.total ?? 0) > 0 && (
                      <>
                        {' '}
                        · {counts!.total} candidate
                        {counts!.total !== 1 ? 's' : ''}
                      </>
                    )}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn('shrink-0 text-xs bg-transparent', cfg.cls)}
                >
                  {cfg.label}
                </Badge>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Application, Job } from '@/store/types';
import { SectionLabel } from './section-label';

interface HiredApplicationsSectionProps {
  applications: Application[];
  jobs: Job[];
  users: { _id: string; firstName: string; lastName: string }[];
  getClientName: (clientId: string) => string;
}

export function HiredApplicationsSection({
  applications,
  jobs,
  users,
  getClientName,
}: HiredApplicationsSectionProps) {
  const hiredApps = applications.filter(a => a.phase === 'hired');
  if (hiredApps.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Hired Applications</SectionLabel>
      <div className="flex flex-col gap-2">
        {hiredApps.map(app => {
          const hJob = jobs.find(j => j._id === app.jobId);
          const hirer = app.hiredBy
            ? users.find(u => u._id === app.hiredBy)
            : null;
          return (
            <div
              key={app._id}
              className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-700/40 dark:bg-emerald-950/20 p-3 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {hJob?.title ?? app.jobId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hJob
                      ? getClientName(hJob.clientId)
                      : app.clientId}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="h-5 text-[10px] font-medium border-[#69c58a] text-[#3d8a5a] dark:border-[#69c58a] dark:text-[#69c58a]"
                >
                  Hired
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {app.hiredAt && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">
                      Hired Date
                    </span>
                    <span className="font-medium">
                      {formatDate(app.hiredAt)}
                    </span>
                  </div>
                )}
                {hirer && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">
                      Hired by
                    </span>
                    <span className="font-medium">
                      {hirer.firstName} {hirer.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

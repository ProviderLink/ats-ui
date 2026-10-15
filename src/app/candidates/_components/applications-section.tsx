import { Skeleton } from '@/components/ui/skeleton';
import type { Application, Job } from '@/store/types';
import { ApplicationCard } from './application-card';
import { SectionLabel } from './section-label';

interface ApplicationsSectionProps {
  applications: Application[];
  loading: boolean;
  jobs: Job[];
  users: { _id: string; firstName: string; lastName: string }[];
  getJobTitle: (jobId: string) => string;
  getClientName: (clientId: string) => string;
}

export function ApplicationsSection({
  applications,
  loading: appLoading,
  jobs,
  users,
  getJobTitle,
  getClientName,
}: ApplicationsSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SectionLabel>Applications</SectionLabel>
        <span className="text-xs text-muted-foreground">
          ({applications.length})
        </span>
      </div>
      {appLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No applications yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {applications.map(app => {
            const pJob = jobs.find(j => j._id === app.jobId);
            const approver = app.approvedBy
              ? users.find(u => u._id === app.approvedBy)
              : null;
            return (
              <ApplicationCard
                key={app._id}
                app={app}
                jobTitle={getJobTitle(app.jobId)}
                clientName={getClientName(app.clientId)}
                stages={pJob?.pipeline?.stages}
                approverName={
                  approver
                    ? `${approver.firstName} ${approver.lastName}`
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

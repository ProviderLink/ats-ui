import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Application, Job } from '@/store';
import { useDashboardStore } from '@/store/slices/dashboard.store';
import {
  BriefcaseIcon,
  CheckCircle2Icon,
  ClockIcon,
  UsersIcon,
  XCircleIcon,
} from 'lucide-react';

function avgDaysToApprove(applications: Application[]): number {
  const valid = applications.filter(a => a.approvedAt && a.appliedAt);
  if (valid.length === 0) return 0;
  const total = valid.reduce((sum, a) => {
    const diff =
      new Date(a.approvedAt!).getTime() - new Date(a.appliedAt).getTime();
    return sum + Math.max(diff / 86_400_000, 0);
  }, 0);
  return Math.round(total / valid.length);
}

function StatItem({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold tabular-nums text-foreground leading-none">
            {value}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

export function DashSnapshot() {
  const { applications, jobs, candidates, loading, kpi } = useDashboardStore();

  if (loading && !kpi) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pending = applications.filter(
    (a: Application) => a.phase === 'pending'
  ).length;
  const total = applications.length || 1;
  const approved = applications.filter(
    (a: Application) => a.phase === 'approved' || a.phase === 'hired'
  ).length;
  const rejected = applications.filter(
    (a: Application) => a.phase === 'rejected'
  ).length;
  const approvalRate = Math.round((approved / total) * 100);
  const rejectionRate = Math.round((rejected / total) * 100);

  const activeJobs = jobs.filter(
    (j: Job) => j.status === 'open' || j.status === 'on_hold'
  );
  const jobsWithNoApps = activeJobs.filter(
    (j: Job) => !applications.some((a: Application) => a.jobId === j._id)
  ).length;

  const talentPool = candidates.filter(
    (c: { inTalentPool?: boolean }) => c.inTalentPool
  ).length;
  const avgDays = avgDaysToApprove(applications);

  const stats = [
    {
      icon: ClockIcon,
      label: 'Pending Review',
      value: pending,
      sub: 'Applications awaiting action',
    },
    {
      icon: CheckCircle2Icon,
      label: 'Approval Rate',
      value: `${approvalRate}%`,
      sub: `${approved} of ${total - 1} total approved`,
    },
    {
      icon: XCircleIcon,
      label: 'Rejection Rate',
      value: `${rejectionRate}%`,
      sub: `${rejected} rejected so far`,
    },
    {
      icon: BriefcaseIcon,
      label: 'Idle Open Roles',
      value: jobsWithNoApps,
      sub: 'Active jobs with no applicants',
    },
    {
      icon: UsersIcon,
      label: 'Talent Pool',
      value: talentPool,
      sub:
        avgDays > 0 ? `Avg ${avgDays}d to approve` : 'Saved for future roles',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recruitment Health</CardTitle>
        <CardDescription>Key operational metrics at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map(s => (
            <StatItem key={s.label} {...s} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

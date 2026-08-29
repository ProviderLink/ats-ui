import { Link } from 'react-router-dom';

import { useDashboardStore } from '@/store/slices/dashboard.store';
import { useUserStore } from '@/store/slices/users.store';

function GlassBadge({
  value,
  label,
  href,
}: {
  value: number;
  label: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 backdrop-blur-sm transition-colors hover:bg-muted"
    >
      <span className="text-lg font-semibold tabular-nums text-foreground leading-none">
        {value}
      </span>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </Link>
  );
}

export function DashBadges() {
  const { kpi } = useDashboardStore();
  const { items: teamItems } = useUserStore();

  if (!kpi) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-28 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>
    );
  }

  const badges = [
    { value: kpi.totalClients, label: 'Clients', href: '/ats/clients' },
    { value: kpi.openJobs, label: 'Open Jobs', href: '/ats/jobs' },
    {
      value: kpi.totalCandidates,
      label: 'Candidates',
      href: '/ats/candidates',
    },
    {
      value: kpi.scheduledInterviews,
      label: 'Scheduled Interviews',
      href: '/ats/calendar',
    },
    { value: teamItems.length, label: 'Team', href: '/ats/team' },
    { value: kpi.hiredCount, label: 'Hires', href: '/ats/candidates' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(b => (
        <GlassBadge key={b.label} {...b} />
      ))}
    </div>
  );
}

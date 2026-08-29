import { ArrowRight, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Candidate } from '@/store';
import { useDashboardStore } from '@/store/slices/dashboard.store';

const STAGES = [
  {
    key: 'pending',
    label: 'Pending Review',
    sub: 'Awaiting evaluation',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.08)',
  },
  {
    key: 'approved',
    label: 'In Pipeline',
    sub: 'Active consideration',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
  },
  {
    key: 'hired',
    label: 'Hired',
    sub: 'Offer accepted',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
  },
  {
    key: 'talentPool',
    label: 'Talent Pool',
    sub: 'Saved for later',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
  },
] as const;

export function DashFunnel() {
  const { loading, kpi, candidates, applications } = useDashboardStore();

  const pendingCount = candidates.filter(
    (c: Candidate) => c.status === 'pending'
  ).length;

  // "In Pipeline" mirrors the Candidates page: a candidate with at least one
  // approved-phase application (not merely candidate.status === 'approved').
  // Fall back to candidate status only if the application list is empty.
  const approvedAppIds = new Set(
    applications.filter(a => a.phase === 'approved').map(a => a.candidateId)
  );
  const approvedStatusIds = new Set(
    candidates.filter(c => c.status === 'approved').map(c => c._id)
  );
  const pipelineIds =
    approvedAppIds.size > 0
      ? approvedAppIds
      : approvedStatusIds.size > 0
        ? approvedStatusIds
        : approvedAppIds;
  const approvedCount = candidates.filter(c => pipelineIds.has(c._id)).length;

  // Keep this funnel candidate-based: "hired" is candidates with status
  // 'hired' — kpi.hiredCount is application-based and would mix units.
  const hiredCount = candidates.filter(
    (c: Candidate) => c.status === 'hired'
  ).length;
  const talentPool = candidates.filter((c: Candidate) => c.inTalentPool).length;

  const counts: Record<string, number> = {
    pending: pendingCount,
    approved: approvedCount,
    hired: hiredCount,
    talentPool: talentPool,
  };

  const total = kpi?.totalCandidates ?? candidates.length;
  const denominator = total || 1;
  const hireRate =
    kpi && kpi.totalApplications > 0
      ? Math.round((kpi.hiredCount / kpi.totalApplications) * 100)
      : 0;

  return (
    <Card className="rounded-md shadow-none border border-border/50 bg-card">
      <CardHeader className="pb-4 pt-5 px-5 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-muted">
              <Users className="size-3.5 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-semibold">
              Hiring Pipeline
            </CardTitle>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold tabular-nums text-foreground">
                {total}
              </span>{' '}
              total candidates
            </span>
            <span className="h-3.5 w-px bg-border" />
            <span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: '#34d399' }}
              >
                {hireRate}%
              </span>{' '}
              hire rate
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-2 divide-x divide-y divide-border/40 lg:grid-cols-4 lg:divide-y-0">
          {loading && candidates.length === 0
            ? STAGES.map(s => (
                <div key={s.key} className="flex flex-col gap-3 p-5">
                  <Skeleton className="h-8 w-16" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))
            : STAGES.map((stage, i) => {
                const count = counts[stage.key] ?? 0;
                const barPct = Math.round((count / denominator) * 100);
                const prevKey = i > 0 ? STAGES[i - 1].key : null;
                const prevCount = prevKey ? (counts[prevKey] ?? 0) : null;
                const conversion =
                  prevCount !== null &&
                  prevCount > 0 &&
                  stage.key !== 'talentPool'
                    ? Math.round((count / prevCount) * 100)
                    : null;

                return (
                  <div
                    key={stage.key}
                    className="group relative flex flex-col gap-3 p-5 transition-colors hover:bg-muted/30"
                  >
                    {/* color accent bar at top */}
                    <div
                      className="absolute inset-x-0 top-0 h-0.5 rounded-t-sm opacity-60"
                      style={{ backgroundColor: stage.color }}
                    />

                    {/* count + conversion badge */}
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="text-4xl font-light tabular-nums leading-none"
                        style={{ color: stage.color }}
                      >
                        {count}
                      </span>
                      {conversion !== null && (
                        <div className="flex items-center gap-0.5 rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <ArrowRight className="size-2.5 shrink-0" />
                          {conversion}%
                        </div>
                      )}
                    </div>

                    {/* labels */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground leading-none">
                        {stage.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {stage.sub}
                      </span>
                    </div>

                    {/* progress bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(barPct, count > 0 ? 5 : 0)}%`,
                          backgroundColor: stage.color,
                          opacity: 0.75,
                        }}
                      />
                    </div>

                    {/* pct of total */}
                    <span className="text-[11px] tabular-nums text-muted-foreground/60">
                      {stage.key !== 'talentPool'
                        ? `${Math.round((count / denominator) * 100)}% of total candidates`
                        : `${count} saved`}
                    </span>
                  </div>
                );
              })}
        </div>
      </CardContent>
    </Card>
  );
}

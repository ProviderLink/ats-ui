import { PlusIcon } from 'lucide-react';
import { Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDashboardStore } from '@/store/slices/dashboard.store';

import { DashAppliedChart } from './_components/dash-applied-chart';
import { DashFunnel } from './_components/dash-funnel';
import { DashHiringTrend } from './_components/dash-hiring-trend';
import { DashMetricCards } from './_components/dash-metric-cards';

function DashboardContent() {
  const { fetch, error, lastLoadedAt } = useDashboardStore();
  const navigate = useNavigate();

  useEffect(() => {
    const STALE_MS = 60 * 1000; // 60s — /ats/dashboard is live, no server cache
    const isStale = !lastLoadedAt || Date.now() - lastLoadedAt > STALE_MS;
    if (isStale) fetch();
  }, [fetch, lastLoadedAt]);

  useEffect(() => {
    if (error) toast.error('Failed to load dashboard data');
  }, [error]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-light tracking-tight text-foreground">
          Hiring Dashboard
        </h1>
        <Button
          onClick={() => navigate('/ats/jobs?action=new')}
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-md border-border/60 bg-muted/30 text-foreground/70 hover:bg-muted/60 hover:text-foreground"
        >
          <PlusIcon className="size-3.5" />
          Post New Job
        </Button>
      </div>

      <Separator />

      {/* Main content */}
      <div className="flex flex-col gap-5 p-6">
        {/* Three metric cards */}
        <DashMetricCards />

        {/* Two large chart cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashAppliedChart />
          </div>
          <div>
            <DashHiringTrend />
          </div>
        </div>

        {/* Full-width recruitment health snapshot */}
        <DashFunnel />
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

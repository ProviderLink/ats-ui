import { TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/slices/dashboard.store';

import { countByMonth, pctChange3m } from '../_utils/month-buckets';

interface MetricCardProps {
  title: string;
  value: number;
  chartData: { month: string; count: number }[];
  change: number;
  color: string;
  chartType?: 'bar' | 'line';
  /** Set to false for metrics where a rise is bad (e.g. time-to-hire). */
  higherIsBetter?: boolean;
}

function MetricChart({
  chartType,
  chartData,
}: Pick<MetricCardProps, 'chartType' | 'chartData'>) {
  const xAxis = (
    <XAxis
      dataKey="month"
      tickLine={false}
      tickMargin={8}
      axisLine={false}
      tickFormatter={v => v.slice(0, 3)}
    />
  );
  const tooltip = (
    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  );

  if (chartType === 'bar') {
    return (
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{ left: 0, right: 0 }}
      >
        <CartesianGrid vertical={false} />
        {xAxis}
        {tooltip}
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    );
  }

  return (
    <LineChart
      accessibilityLayer
      data={chartData}
      margin={{ left: 12, right: 12 }}
    >
      <CartesianGrid vertical={false} />
      {xAxis}
      {tooltip}
      <Line
        dataKey="count"
        type="linear"
        stroke="var(--color-count)"
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  );
}

function MetricCard({
  title,
  value,
  chartData,
  change,
  color,
  chartType = 'bar',
  higherIsBetter = true,
}: MetricCardProps) {
  // A change of exactly 0 is neutral, not bad.
  const isFlat = change === 0;
  const isUp = change > 0;
  const isGood = isFlat ? null : isUp === higherIsBetter;

  const config: ChartConfig = {
    count: { label: title, color },
  };

  return (
    <Card className="rounded-md shadow-none border border-border/50 relative bg-card">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          background: `radial-gradient(ellipse at 15% 0%, ${color}, transparent 60%)`,
        }}
      />
      <CardHeader className="relative pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardDescription>
        <CardTitle
          className="text-5xl font-extralight tabular-nums leading-none"
          style={{ color, filter: `drop-shadow(0 0 16px ${color})` }}
        >
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative px-2 pb-0 sm:px-6">
        <ChartContainer config={config} className="aspect-auto h-28 w-full">
          <MetricChart chartType={chartType} chartData={chartData} />
        </ChartContainer>
      </CardContent>
      <CardFooter className="relative flex-col items-start gap-1 pt-2 text-xs">
        <div
          className={cn(
            'flex items-center gap-1 font-medium',
            isGood === null
              ? 'text-muted-foreground'
              : isGood
                ? 'text-success'
                : 'text-destructive'
          )}
        >
          {change > 0 ? '+' : ''}
          {change}% vs last 3 months
          {isUp ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          )}
        </div>
        <div className="text-muted-foreground">Last 6 months</div>
      </CardFooter>
    </Card>
  );
}

function MetricCardSkeleton() {
  return (
    <Card className="rounded-md shadow-none border border-border overflow-hidden">
      <CardHeader className="pb-0">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="pt-0 pb-5">
        <div className="flex items-end gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-16 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-24 w-32 shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashMetricCards() {
  const kpi = useDashboardStore(s => s.kpi);
  const candidates = useDashboardStore(s => s.candidates);
  const clients = useDashboardStore(s => s.clients);
  const jobs = useDashboardStore(s => s.jobs);
  const loading = useDashboardStore(s => s.loading);

  // `kpi` is null until the first fetch resolves, so the skeleton covers the
  // whole wait instead of flashing a previous session's numbers.
  if (loading && !kpi) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!kpi) return null;

  const candidateDates = candidates.map(c => c.createdAt);
  const clientDates = clients.map(c => c.createdAt);
  // "Open Jobs" is a point-in-time stock, so its sparkline and % change use
  // currently-open jobs only, not all jobs ever created.
  const openJobDates = jobs
    .filter(j => j.status === 'open')
    .map(j => j.createdAt);

  const cards = [
    {
      title: 'Candidates',
      value: kpi.totalCandidates,
      chartData: countByMonth(candidateDates, 6),
      change: pctChange3m(candidateDates),
      color: 'var(--primary)',
      chartType: 'bar' as const,
    },
    {
      title: 'Clients',
      value: kpi.totalClients,
      chartData: countByMonth(clientDates, 6),
      change: pctChange3m(clientDates),
      color: '#3b82f6',
      chartType: 'line' as const,
    },
    {
      title: 'Open Jobs',
      value: kpi.openJobs,
      chartData: countByMonth(openJobDates, 6),
      change: pctChange3m(openJobDates),
      color: '#10b981',
      chartType: 'line' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(c => (
        <MetricCard key={c.title} {...c} />
      ))}
    </div>
  );
}

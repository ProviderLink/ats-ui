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
import type { Candidate, Client, Job } from '@/store';
import { useDashboardStore } from '@/store/slices/dashboard.store';

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthly6m(
  dates: (string | undefined | null)[]
): { month: string; count: number }[] {
  const now = new Date();
  const buckets: { key: string; month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: getMonthKey(d),
      month: MONTH_SHORT[d.getMonth()],
      count: 0,
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const raw of dates) {
    if (!raw) continue;
    const d = new Date(raw);
    if (isNaN(d.getTime())) continue;
    const i = idx.get(getMonthKey(d));
    if (i !== undefined) buckets[i].count += 1;
  }
  return buckets;
}

function pctChange3m(dates: (string | undefined | null)[]): number {
  const now = new Date();
  const cur3Start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const prev3Start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  let cur = 0,
    prev = 0;
  for (const raw of dates) {
    if (!raw) continue;
    const d = new Date(raw);
    if (isNaN(d.getTime())) continue;
    if (d >= cur3Start) cur += 1;
    else if (d >= prev3Start) prev += 1;
  }
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

function MetricCard({
  title,
  value,
  chartData,
  change,
  color,
  chartType = 'bar',
  higherIsBetter = true,
}: {
  title: string;
  value: number;
  chartData: { month: string; count: number }[];
  change: number;
  color: string;
  chartType?: 'bar' | 'line';
  /**
   * Which direction is good for this metric. Defaults to true (growth is good),
   * which suits Candidates/Clients/Open Jobs. A metric where more is worse —
   * time-to-hire, rejection rate — must pass `false`, otherwise a rise renders
   * green. Previously the tone was derived from the sign alone, so polarity was
   * not expressible.
   */
  higherIsBetter?: boolean;
}) {
  // A change of exactly 0 is neutral, not bad — it flags as "down" otherwise
  // because `change >= 0` would make isUp true while the arrow said otherwise.
  const isFlat = change === 0;
  const isUp = change > 0;
  const isGood = isFlat ? null : isUp === higherIsBetter;

  const config: ChartConfig = {
    count: { label: title, color },
  };

  if (chartType === 'bar') {
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
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 0, right: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tickFormatter={v => v.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
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
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={v => v.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="count"
              type="linear"
              stroke="var(--color-count)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
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
  const { kpi, candidates, clients, jobs, loading } = useDashboardStore();

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

  const candidateDates = candidates.map((c: Candidate) => c.createdAt);
  const clientDates = clients.map((c: Client) => c.createdAt);
  // "Open Jobs" is a point-in-time stock — its sparkline / % change should be
  // driven by the same set of currently-open jobs, not all jobs ever created.
  const openJobDates = jobs
    .filter((j: Job) => j.status === 'open')
    .map((j: Job) => j.createdAt);

  const cards = [
    {
      title: 'Candidates',
      value: kpi.totalCandidates,
      chartData: buildMonthly6m(candidateDates),
      change: pctChange3m(candidateDates),
      color: 'var(--primary)',
      gradientId: 'grad-candidates',
      chartType: 'bar' as const,
    },
    {
      title: 'Clients',
      value: kpi.totalClients,
      chartData: buildMonthly6m(clientDates),
      change: pctChange3m(clientDates),
      color: '#3b82f6',
      gradientId: 'grad-clients',
      chartType: 'line' as const,
    },
    {
      title: 'Open Jobs',
      value: kpi.openJobs,
      chartData: buildMonthly6m(openJobDates),
      change: pctChange3m(openJobDates),
      color: '#10b981',
      gradientId: 'grad-jobs',
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

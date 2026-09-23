import * as React from 'react';
import type { ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
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
import type { Application } from '@/store';
import { useDashboardStore } from '@/store/slices/dashboard.store';

const chartConfig = {
  applied: { label: 'Applications', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const RANGES = [
  { key: '30d', label: '30d', months: 0, days: 30 },
  { key: '3m', label: '3m', months: 3, days: 0 },
  { key: '6m', label: '6m', months: 6, days: 0 },
  { key: '12m', label: '12m', months: 12, days: 0 },
] as const;

type Range = (typeof RANGES)[number]['key'];

function buildDailyData(applications: Application[], days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: { date: string; applied: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      applied: 0,
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.date, i]));
  for (const app of applications) {
    if (!app.appliedAt) continue;
    const d = new Date(app.appliedAt);
    if (isNaN(d.getTime())) continue;
    d.setHours(0, 0, 0, 0);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const i = idx.get(key);
    if (i !== undefined) buckets[i].applied += 1;
  }
  return buckets;
}

function buildMonthlyData(applications: Application[], months: number) {
  const now = new Date();
  const buckets: { date: string; applied: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      applied: 0,
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.date.slice(0, 7), i]));
  for (const app of applications) {
    if (!app.appliedAt) continue;
    const d = new Date(app.appliedAt);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const i = idx.get(key);
    if (i !== undefined) buckets[i].applied += 1;
  }
  return buckets;
}

export function DashAppliedChart() {
  const { applications, loading } = useDashboardStore();
  const [activeRange, setActiveRange] = React.useState<Range>('6m');

  const dataByRange = React.useMemo(() => {
    return {
      '30d': buildDailyData(applications, 30),
      '3m': buildMonthlyData(applications, 3),
      '6m': buildMonthlyData(applications, 6),
      '12m': buildMonthlyData(applications, 12),
    };
  }, [applications]);

  const totals = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(dataByRange).map(([k, v]) => [
          k,
          v.reduce((s, d) => s + d.applied, 0),
        ])
      ) as Record<Range, number>,
    [dataByRange]
  );

  const data = dataByRange[activeRange];

  const tickFormatter = (value: string) => {
    const d = new Date(value);
    if (activeRange === '30d') {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'short' });
  };

  // Recharts types the tooltip `label` as a ReactNode (so it includes
  // undefined), while we only ever feed it the date string from the data.
  // Widening the parameter and guarding keeps the types honest without an
  // `any` cast, which previously hid this mismatch.
  const labelFormatter = (value: ReactNode) => {
    if (typeof value !== 'string') return '';
    const d = new Date(value);
    if (activeRange === '30d') {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <Card className="flex flex-col rounded-md shadow-none border border-border/50 bg-card py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0!">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4">
          <CardTitle className="text-base">Application Trend</CardTitle>
          <CardDescription>
            Total applications per selected period
          </CardDescription>
        </div>
        <div className="flex">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              data-active={activeRange === key}
              onClick={() => setActiveRange(key)}
              className="flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-6 sm:py-4 transition-colors hover:bg-muted/30"
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-lg font-bold leading-none tabular-nums sm:text-2xl">
                {loading && applications.length === 0 ? (
                  <span className="text-muted-foreground/40">—</span>
                ) : (
                  totals[key].toLocaleString()
                )}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:p-6">
        {loading && applications.length === 0 ? (
          <Skeleton className="h-62.5 w-full" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-62.5 w-full"
          >
            <LineChart
              accessibilityLayer
              data={data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={tickFormatter}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-40"
                    nameKey="applied"
                    labelFormatter={labelFormatter}
                  />
                }
              />
              <Line
                dataKey="applied"
                type="monotone"
                stroke="var(--color-applied)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

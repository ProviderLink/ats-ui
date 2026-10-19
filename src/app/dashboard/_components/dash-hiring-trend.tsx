import type { ReactNode } from 'react';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

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
import type { DashApplication } from '@/store';
import { useDashboardStore } from '@/store/slices/dashboard.store';

import { countByMonth } from '../_utils/month-buckets';

const HIRE_COLOR = '#34d399';

const chartConfig = {
  hires: { label: 'Hires', color: HIRE_COLOR },
} satisfies ChartConfig;

function buildMonthlyData(applications: DashApplication[], months: number) {
  // Only trust the actual hire date; falling back to `updatedAt`/`appliedAt`
  // would plot the hire in the wrong month when `hiredAt` is missing.
  const hireDates = applications
    .filter(app => app.phase === 'hired')
    .map(app => app.hiredAt);
  return countByMonth(hireDates, months).map(b => ({
    date: b.date,
    hires: b.count,
  }));
}

export function DashHiringTrend() {
  const applications = useDashboardStore(s => s.applications);
  const loading = useDashboardStore(s => s.loading);
  const kpi = useDashboardStore(s => s.kpi);

  const data = React.useMemo(
    () => buildMonthlyData(applications, 6),
    [applications]
  );

  const totalHires = kpi?.hiredCount ?? data.reduce((s, d) => s + d.hires, 0);
  // The last bucket is the current (partial) month.
  const lastMonthHires = data[data.length - 2]?.hires ?? 0;

  const tickFormatter = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short' });

  // Recharts types the tooltip `label` as a ReactNode, but it is always the
  // date string from `data`.
  const labelFormatter = (value: ReactNode) =>
    typeof value === 'string'
      ? new Date(value).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })
      : '';

  return (
    <Card className="h-full flex flex-col rounded-md shadow-none border border-border/50 bg-card py-0">
      <CardHeader className="border-b p-0!">
        <div className="flex flex-col justify-center gap-1 px-6 py-4">
          <CardTitle className="text-base">Hiring Trend</CardTitle>
          <CardDescription>
            <span
              className="font-medium tabular-nums"
              style={{ color: HIRE_COLOR }}
            >
              {totalHires}
            </span>{' '}
            total · <span style={{ color: HIRE_COLOR }}>{lastMonthHires}</span>{' '}
            last month
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col min-h-0 px-2 pt-4 pb-0 sm:px-6 sm:pb-0">
        {loading && applications.length === 0 ? (
          <Skeleton className="flex-1 w-full min-h-50" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="flex-1 w-full min-h-50"
            initialDimension={{ width: 400, height: 300 }}
          >
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ left: 12, right: 12 }}
            >
              <defs>
                <linearGradient id="fillHires" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={HIRE_COLOR} stopOpacity={0.3} />
                  <stop
                    offset="95%"
                    stopColor={HIRE_COLOR}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
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
                    nameKey="hires"
                    labelFormatter={labelFormatter}
                  />
                }
              />
              <Area
                dataKey="hires"
                type="monotone"
                stroke={HIRE_COLOR}
                strokeWidth={2}
                fill="url(#fillHires)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: HIRE_COLOR }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="p-0">
        <Link
          to="/ats/jobs"
          className="flex w-full items-center justify-center gap-1.5 py-3 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ backgroundColor: `${HIRE_COLOR}18`, color: HIRE_COLOR }}
        >
          View Open Roles
        </Link>
      </CardFooter>
    </Card>
  );
}

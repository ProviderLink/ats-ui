import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  experienceLevelLabel,
  formatDate,
  formatDeadline,
  formatSalary,
  jobTypeLabel,
  locationTypeLabel,
} from '@/lib/job-format';
import { publicApi } from '@/lib/public-api';
import { cn } from '@/lib/utils';
import type { Job } from '@/store';
import {
  BriefcaseIcon,
  CommandIcon,
  MapPinIcon,
  SearchIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function CareersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await publicApi.get<Job[] | { data: Job[] }>('/ats/jobs', {
          status: 'open',
          limit: 9999,
        });
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res.data ?? []);
        setJobs(list);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? jobs.filter(
          j =>
            j.title.toLowerCase().includes(q) ||
            (j.location ?? '').toLowerCase().includes(q)
        )
      : jobs;
    return [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [jobs, query]);

  function handleSearch(value: string) {
    setQuery(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
      {/* Hero — centered, minimal */}
      <section className="flex flex-col items-center gap-5 text-center">
        <Link
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
          to="/careers"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <CommandIcon className="size-4" />
          </span>
          <span>Arista Careers</span>
        </Link>
        <h1 className="font-heading text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Open positions
        </h1>
        <p className="max-w-xl text-balance text-sm text-muted-foreground sm:text-base">
          Find your next role. Browse our open positions and apply online in a
          few minutes.
        </p>
        <div className="relative w-full max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by title or location"
            className="h-10 rounded-md pl-9"
            aria-label="Search jobs"
          />
        </div>
      </section>

      {/* Stats + list */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <BriefcaseIcon className="size-4 text-muted-foreground" />
            {loading
              ? 'Loading roles…'
              : `${filtered.length} open ${filtered.length === 1 ? 'role' : 'roles'}`}
          </span>
          {query && (
            <button
              type="button"
              onClick={() => handleSearch('')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear search
            </button>
          )}
        </div>

        {loading && <JobListSkeleton />}

        {!loading && error && (
          <Card className="rounded-sm border border-border">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              We couldn&rsquo;t load jobs right now. Please try again later.
            </CardContent>
          </Card>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Card className="rounded-sm border border-border">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <SearchIcon className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  No open roles match your search
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different keyword or{' '}
                  <button
                    type="button"
                    onClick={() => handleSearch('')}
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    clear filters
                  </button>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((job, i) => (
              <JobCard key={job._id} job={job} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function JobCard({ job, index: _index }: { job: Job; index: number }) {
  const deadline = job.applicationDeadline
    ? formatDeadline(job.applicationDeadline)
    : null;
  const to = `/careers/${job._id}`;

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md hover:border-foreground/20 transition-shadow">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <Link to={to} className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {jobTypeLabel[job.jobType]}
            </Badge>
            {deadline && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  deadline.destructive &&
                    'border-destructive/30 text-destructive'
                )}
              >
                {deadline.text}
              </Badge>
            )}
          </div>
          <h2 className="font-heading text-balance text-base font-semibold leading-snug text-foreground">
            {job.title}
          </h2>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-3.5" />
                {job.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <UsersIcon className="size-3.5" />
              {job.openings} opening{job.openings === 1 ? '' : 's'}
              <span className="mx-0.5">·</span>
              Posted {formatDate(job.createdAt)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              {locationTypeLabel[job.locationType]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {experienceLevelLabel[job.experienceLevel]}
            </Badge>
            {job.salaryRange && (
              <Badge variant="outline" className="text-xs">
                {formatSalary(job.salaryRange)}
              </Badge>
            )}
          </div>
        </Link>
        <Link to={to}>
          <Button size="default" className="w-full">
            View details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function JobListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-lg border border-border">
          <CardContent className="flex flex-col gap-3 p-5">
            <Skeleton className="h-5 w-2/5 rounded-sm" />
            <Skeleton className="h-5 w-3/5 rounded-sm" />
            <Skeleton className="h-3.5 w-4/5 rounded-sm" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-sm" />
              <Skeleton className="h-5 w-20 rounded-sm" />
            </div>
            <Skeleton className="h-8 w-full rounded-sm" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

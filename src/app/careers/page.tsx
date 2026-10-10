import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatSalary,
  jobTypeLabel,
  locationTypeLabel,
} from '@/lib/job-format';
import { publicApi } from '@/lib/public-api';
import { timeAgo } from '@/lib/utils';
import type { Job } from '@/store';
import { SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CareersDoodles } from './_components/careers-doodles';

function plainText(html: string): string {
  return (
    new DOMParser()
      .parseFromString(html, 'text/html')
      .body.textContent?.replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}

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
    <div className="relative flex-1 overflow-hidden">
      <CareersDoodles />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:px-20">
        <header className="flex flex-col gap-6">
          <Link
            to="/careers"
            className="flex items-center gap-2 text-sm font-medium text-white"
          >
            <img
              src="/arista-ats.png"
              alt=""
              className="size-6 rounded-md object-contain"
            />
            Arista Careers
          </Link>
          <div className="mt-8 flex flex-col gap-4">
            <span className="w-fit border-b border-careers-accent pb-0.5 text-xs font-medium uppercase tracking-wide text-careers-accent">
              Career
            </span>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Open positions
            </h1>
          </div>
          <div className="relative w-full max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
            <Input
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by title or location"
              className="h-10 rounded-lg border-white/20 bg-white/5 pl-9 text-white placeholder:text-white/50 focus-visible:border-careers-accent focus-visible:ring-careers-accent/30"
              aria-label="Search jobs"
            />
          </div>
        </header>

        <section className="flex max-w-3xl flex-col gap-6">
          {loading && <JobListSkeleton />}

          {!loading && error && (
            <Notice>
              We couldn&rsquo;t load jobs right now. Please try again later.
            </Notice>
          )}

          {!loading && !error && filtered.length === 0 && (
            <Notice>
              {query ? (
                <>
                  No open roles match your search.{' '}
                  <button
                    type="button"
                    onClick={() => handleSearch('')}
                    className="text-careers-accent underline-offset-4 hover:underline"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                'There are no open positions right now. Please check back soon.'
              )}
            </Notice>
          )}

          {!loading &&
            !error &&
            filtered.map(job => <JobCard key={job._id} job={job} />)}
        </section>
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-white/15 px-6 py-10 text-center text-sm text-white/70">
      {children}
    </p>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-careers px-2.5 py-1 text-sm text-careers">
      {children}
    </span>
  );
}

function JobCard({ job }: { job: Job }) {
  const excerpt = plainText(job.description);

  return (
    <Link
      to={`/careers/${job._id}`}
      className="group flex flex-col gap-4 rounded-2xl bg-white p-6 text-neutral-900 transition-shadow hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-careers-accent"
    >
      <h2 className="font-heading text-xl font-medium">{job.title}</h2>
      {excerpt && (
        <p className="line-clamp-3 max-w-xl text-base text-neutral-500">
          {excerpt}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Tag>{jobTypeLabel[job.jobType]}</Tag>
          {job.location && <Tag>{job.location}</Tag>}
          <Tag>{locationTypeLabel[job.locationType]}</Tag>
          {job.salaryRange && <Tag>{formatSalary(job.salaryRange)}</Tag>}
        </div>
        <span className="text-sm text-neutral-500">
          Posted {timeAgo(job.createdAt)}
        </span>
      </div>
    </Link>
  );
}

function JobListSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-2xl bg-white/10" />
      ))}
    </>
  );
}

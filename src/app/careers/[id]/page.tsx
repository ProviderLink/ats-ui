import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  experienceLevelLabel,
  formatDate,
  formatDeadline,
  formatSalary,
  jobTypeLabel,
  locationTypeLabel,
  toChips,
} from '@/lib/job-format';
import { publicApi } from '@/lib/public-api';
import { cn } from '@/lib/utils';
import type { Job } from '@/store';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  MapPinIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function CareerJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await publicApi.get<Job>(`/ats/jobs/${id}`);
        if (cancelled) return;
        setJob(data);
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
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (error || !job) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-10">
        <Card className="rounded-sm">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {error
                ? 'We couldn\u2019t load this job right now.'
                : 'This job is no longer available.'}
            </p>
            <Link to="/careers">
              <Button variant="outline" size="sm">
                Back to jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deadline = job.applicationDeadline
    ? formatDeadline(job.applicationDeadline)
    : null;
  const skills = toChips(job.skills);
  const requirements = toChips(job.requirements);
  const responsibilities = toChips(job.responsibilities);
  const benefits = toChips(job.benefits);
  const expired = deadline?.destructive ?? false;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      {/* Top — back link */}
      <Link
        to="/careers"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        All open positions
      </Link>

      {/* Hero — title + meta */}
      <header className="flex flex-col gap-5 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {jobTypeLabel[job.jobType]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {locationTypeLabel[job.locationType]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {experienceLevelLabel[job.experienceLevel]}
          </Badge>
          {deadline && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                deadline.destructive && 'border-destructive/30 text-destructive'
              )}
            >
              {deadline.text}
            </Badge>
          )}
        </div>
        <h1 className="font-heading text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {job.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="size-4" />
              {job.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <UsersIcon className="size-4" />
            {job.openings} opening{job.openings === 1 ? '' : 's'}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="size-4" />
            Posted {formatDate(job.createdAt)}
          </span>
        </div>
      </header>

      {/* Body — 2-column with sticky sidebar */}
      <div className="grid w-full gap-10 lg:grid-cols-3 lg:gap-12">
        <article className="flex flex-col gap-10 lg:col-span-2">
          {job.salaryRange && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted p-5">
              <span className="text-xs text-muted-foreground">
                Compensation
              </span>
              <p className="text-lg font-semibold text-foreground">
                {formatSalary(job.salaryRange)}
              </p>
            </div>
          )}

          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              About the role
            </h2>
            <p className="text-base leading-relaxed text-foreground whitespace-pre-line">
              {job.description}
            </p>
          </section>

          {skills.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <Badge
                    key={`${skill}-${i}`}
                    variant="secondary"
                    className="rounded-md px-2.5 py-1 font-normal text-sm"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {requirements.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Requirements
              </h2>
              <CheckList items={requirements} />
            </section>
          )}

          {responsibilities.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Responsibilities
              </h2>
              <BulletList items={responsibilities} />
            </section>
          )}

          {benefits.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Benefits
              </h2>
              <CheckList items={benefits} />
            </section>
          )}
        </article>

        {/* Sticky sidebar — facts + apply CTA */}
        <aside className="lg:col-span-1">
          <div className="sticky top-8 flex flex-col gap-5">
            <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Apply by
                </span>
                <p className="text-base font-medium text-foreground">
                  {deadline ? deadline.text : 'Open until filled'}
                </p>
              </div>
              <div className="h-px bg-border-subtle" />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Openings
                </span>
                <p className="text-base font-medium text-foreground">
                  {job.openings} role{job.openings === 1 ? '' : 's'}
                </p>
              </div>
              {job.salaryRange && (
                <>
                  <div className="h-px bg-border-subtle" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Compensation
                    </span>
                    <p className="text-base font-medium text-foreground">
                      {formatSalary(job.salaryRange)}
                    </p>
                  </div>
                </>
              )}
              <div className="h-px bg-border-subtle" />
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full"
                  disabled={expired}
                  onClick={() => navigate(`/careers/${job._id}/apply`)}
                >
                  {expired ? 'Applications closed' : 'Apply now'}
                </Button>
                {!expired && (
                  <p className="text-center text-xs text-muted-foreground">
                    Takes ~3 minutes · Resume + video intro
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-base text-foreground"
        >
          <span className="mt-2 size-1.5 rounded-full bg-muted-foreground shrink-0" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-base text-foreground"
        >
          <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <Skeleton className="h-4 w-32 rounded-sm" />
      <div className="flex flex-col gap-5">
        <Skeleton className="h-10 w-2/3 rounded-sm" />
        <Skeleton className="h-4 w-1/2 rounded-sm" />
      </div>
      <Skeleton className="h-28 w-full rounded-sm" />
      <Skeleton className="h-48 w-full rounded-sm" />
      <Skeleton className="h-32 w-2/3 rounded-sm" />
    </div>
  );
}

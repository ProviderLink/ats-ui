import { RichText } from '@/components/rich-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  experienceLevelLabel,
  formatDeadline,
  formatSalary,
  jobTypeLabel,
  locationTypeLabel,
  toBullets,
  toChips,
} from '@/lib/job-format';
import { timeAgo } from '@/lib/utils';
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApplyButton } from '../_components/apply-button';
import { CareersDoodles } from '../_components/careers-doodles';
import {
  BulletList,
  CheckList,
  Section,
} from '../_components/job-detail-sections';
import { JobDetailSkeleton } from '../_components/job-detail-skeleton';
import { JobClosedNotice } from '../_components/job-closed-notice';
import { JobFacts, type JobFact } from '../_components/job-facts';
import { SectionNav, type NavSection } from '../_components/section-nav';
import { usePublicJob } from '../_utils/use-public-job';

export default function CareerJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { job, loading, error } = usePublicJob(id);

  if (loading) return <JobDetailSkeleton />;
  if (error || !job) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-10">
        <Card className="careers-card rounded-2xl">
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

  if (job.status !== 'open') return <JobClosedNotice title={job.title} />;

  const deadline = job.applicationDeadline
    ? formatDeadline(job.applicationDeadline)
    : null;
  const expired = deadline?.destructive ?? false;
  const skills = toChips(job.skills);
  const responsibilities = toBullets(job.responsibilities);
  const requirements = toBullets(job.requirements);
  const benefits = toBullets(job.benefits);
  const apply = () => navigate(`/careers/${job._id}/apply`);

  const facts: JobFact[] = [
    job.salaryRange && {
      label: 'Compensation',
      value: formatSalary(job.salaryRange),
    },
    { label: 'Job type', value: jobTypeLabel[job.jobType] },
    { label: 'Work mode', value: locationTypeLabel[job.locationType] },
    { label: 'Experience', value: experienceLevelLabel[job.experienceLevel] },
    {
      label: 'Apply by',
      value: deadline ? deadline.text : 'Open until filled',
    },
  ].filter((f): f is JobFact => Boolean(f));

  const sections: NavSection[] = [
    { id: 'about', label: 'About the role' },
    responsibilities.length > 0 && {
      id: 'responsibilities',
      label: 'Responsibilities',
    },
    requirements.length > 0 && { id: 'requirements', label: 'Requirements' },
    skills.length > 0 && { id: 'skills', label: 'Skills' },
    benefits.length > 0 && { id: 'benefits', label: 'Benefits' },
  ].filter((x): x is NavSection => Boolean(x));

  return (
    <div className="relative flex-1 overflow-x-clip">
      <CareersDoodles variant="detail" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-28 pt-10 sm:px-10 sm:pt-14 lg:px-12 lg:pb-16">
        <Link
          to="/careers"
          className="flex w-fit items-center gap-1.5 text-sm text-white/70 hover:text-white"
        >
          <ArrowLeftIcon className="size-4" />
          All open positions
        </Link>

        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-3xl flex-col gap-4">
            <h1 className="font-heading text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70">
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
                Posted {timeAgo(job.createdAt)}
              </span>
            </div>
          </div>
          <ApplyButton
            expired={expired}
            onClick={apply}
            className="hidden lg:inline-flex"
          />
        </header>

        <JobFacts facts={facts} />

        <div className="grid gap-x-12 gap-y-4 grid-cols-[minmax(0,1fr)] lg:grid-cols-[13rem_minmax(0,1fr)]">
          <aside>
            <SectionNav sections={sections} />
          </aside>

          <article className="careers-card flex flex-col rounded-2xl">
            <Section id="about" title="About the role">
              <RichText
                html={job.description}
                className="text-base leading-relaxed text-foreground"
              />
            </Section>
            {responsibilities.length > 0 && (
              <Section id="responsibilities" title="Responsibilities">
                <BulletList items={responsibilities} />
              </Section>
            )}
            {requirements.length > 0 && (
              <Section id="requirements" title="Requirements">
                <CheckList items={requirements} />
              </Section>
            )}
            {skills.length > 0 && (
              <Section id="skills" title="Skills">
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <Badge
                      key={`${skill}-${i}`}
                      variant="secondary"
                      className="rounded-md px-2.5 py-1 text-sm font-normal"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Section>
            )}
            {benefits.length > 0 && (
              <Section id="benefits" title="Benefits">
                <CheckList items={benefits} />
              </Section>
            )}

            <div className="flex flex-col items-start justify-between gap-4 rounded-b-2xl bg-muted p-6 sm:flex-row sm:items-center sm:p-8">
              <div>
                <p className="text-lg font-semibold">
                  Interested in this role?
                </p>
                <p className="text-sm text-muted-foreground">
                  Takes ~3 minutes · Resume + video intro
                </p>
              </div>
              <ApplyButton expired={expired} onClick={apply} />
            </div>
          </article>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/15 bg-careers/95 p-4 backdrop-blur lg:hidden">
          <ApplyButton expired={expired} onClick={apply} className="w-full" />
        </div>
      </div>
    </div>
  );
}

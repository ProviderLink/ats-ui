import type { CreateJobDto, Job, SalaryPeriod } from '@/store';
import { getTagIds } from '@/lib/tags';

export interface JobFormState {
  title: string;
  clientId: string;
  pipelineId: string;
  jobType: string;
  locationType: string;
  location: string;
  experienceLevel: string;
  priority: string;
  openings: string;
  applicationDeadline: string;
  startDate: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  salaryPeriod: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  tagIds: string[];
  benefits: string[];
}

export function initialJobForm(
  job: Job | undefined,
  defaultPipelineId: string
): JobFormState {
  return {
    title: job?.title ?? '',
    clientId: job?.clientId ?? '',
    pipelineId: job?.pipeline?.templateId ?? defaultPipelineId,
    jobType: job?.jobType ?? '',
    locationType: job?.locationType ?? '',
    location: job?.location ?? '',
    experienceLevel: job?.experienceLevel ?? '',
    priority: job?.priority ?? 'medium',
    openings: String(job?.openings ?? 1),
    applicationDeadline: job?.applicationDeadline
      ? job.applicationDeadline.slice(0, 10)
      : '',
    startDate: job?.startDate ? job.startDate.slice(0, 10) : '',
    salaryMin: String(job?.salaryRange?.min ?? ''),
    salaryMax: String(job?.salaryRange?.max ?? ''),
    currency: job?.salaryRange?.currency ?? 'USD',
    salaryPeriod: job?.salaryRange?.period ?? '',
    description: job?.description ?? '',
    requirements: job?.requirements?.length ? job.requirements : [''],
    responsibilities: job?.responsibilities?.length
      ? job.responsibilities
      : [''],
    skills: job?.skills ?? [],
    tagIds: getTagIds(job?.tags),
    benefits: job?.benefits ?? [],
  };
}

export function buildJobDto(form: JobFormState) {
  const salaryRange =
    form.salaryMin && form.salaryMax && form.salaryPeriod
      ? {
          min: Number(form.salaryMin),
          max: Number(form.salaryMax),
          currency: form.currency,
          period: form.salaryPeriod as SalaryPeriod,
        }
      : undefined;

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    clientId: form.clientId,
    pipelineTemplateId: form.pipelineId || undefined,
    jobType: form.jobType as CreateJobDto['jobType'],
    locationType: form.locationType as CreateJobDto['locationType'],
    location: form.location.trim() || undefined,
    experienceLevel: form.experienceLevel as CreateJobDto['experienceLevel'],
    priority: form.priority as CreateJobDto['priority'],
    openings: Number(form.openings) || 1,
    requirements: form.requirements.filter(Boolean),
    responsibilities: form.responsibilities.filter(Boolean),
    skills: form.skills,
    tags: form.tagIds,
    benefits: form.benefits.filter(Boolean),
    salaryRange,
    applicationDeadline: form.applicationDeadline
      ? new Date(form.applicationDeadline).toISOString()
      : undefined,
    startDate: form.startDate
      ? new Date(form.startDate).toISOString()
      : undefined,
  };
}

/** True when any AI-fillable list still holds content. */
export function hasListContent(form: JobFormState): boolean {
  return (
    form.requirements.some(Boolean) ||
    form.responsibilities.some(Boolean) ||
    form.skills.length > 0 ||
    form.benefits.some(Boolean)
  );
}

/** Count of fields that already hold content and would be replaced by Generate. */
export function countFilledFields(form: JobFormState): number {
  return (
    (form.title.trim() ? 1 : 0) +
    (form.description.trim() ? 1 : 0) +
    (form.requirements.some(Boolean) ? 1 : 0) +
    (form.responsibilities.some(Boolean) ? 1 : 0) +
    (form.skills.length > 0 ? 1 : 0) +
    (form.benefits.some(Boolean) ? 1 : 0)
  );
}

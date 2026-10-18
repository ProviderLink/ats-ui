import { RichText } from '@/components/rich-text';
import { TagsSelector } from '@/components/tags-selector';
import { Badge } from '@/components/ui/badge';
import {
  experienceLevelLabel,
  formatDeadline,
  formatSalary,
  jobTypeLabel,
  locationTypeLabel,
} from '@/lib/job-format';
import { useResolvedTags } from '@/lib/tags';
import type { Job } from '@/store';
import { useJobStore, useTagStore } from '@/store';
import { normalizeBullets } from '../../_utils/job-details';
import { BulletList } from './bullet-list';
import { DetailSection } from './detail-section';
import { MetaField } from './meta-field';

interface JobDetailsProps {
  job: Job;
  clientName: string;
}

export function JobDetails({ job, clientName }: JobDetailsProps) {
  const deadline = job.applicationDeadline
    ? formatDeadline(job.applicationDeadline)
    : null;
  const requirements = normalizeBullets(job.requirements);
  const responsibilities = normalizeBullets(job.responsibilities);
  const benefits = normalizeBullets(job.benefits);
  const jobTags = useResolvedTags(job.tags);
  const allTags = useTagStore(s => s.items);
  const updateJob = useJobStore(s => s.update);

  return (
    <div className="space-y-7 max-w-2xl">
      <DetailSection title="Overview">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          <MetaField label="Client" value={clientName} />
          <MetaField label="Job Type" value={jobTypeLabel[job.jobType]} />
          <MetaField
            label="Experience"
            value={experienceLevelLabel[job.experienceLevel]}
          />
          <MetaField
            label="Location Type"
            value={locationTypeLabel[job.locationType]}
          />
          {job.location && <MetaField label="Location" value={job.location} />}
          <MetaField label="Openings" value={String(job.openings)} />
        </div>
      </DetailSection>

      <DetailSection title="Compensation & Dates">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          {job.salaryRange && (
            <div className="col-span-2 sm:col-span-1">
              <MetaField
                label="Salary Range"
                value={formatSalary(job.salaryRange)}
              />
            </div>
          )}
          {job.startDate && (
            <MetaField label="Start Date" value={job.startDate} />
          )}
          {deadline && (
            <MetaField
              label="Deadline"
              value={deadline.text}
              destructive={deadline.destructive}
            />
          )}
          <MetaField label="Posted" value={job.createdAt.slice(0, 10)} />
        </div>
      </DetailSection>

      {(job.skills?.length ?? 0) > 0 && (
        <DetailSection title="Skills">
          <div className="flex flex-wrap gap-1.5 max-w-full">
            {normalizeBullets(job.skills)
              .flatMap(s =>
                s
                  // Split on common delimiters when present; otherwise keep
                  // the whole entry so paragraph-style skills wrap inside
                  // their own chip instead of overflowing the container.
                  .split(/[,·|;\n]/)
                  .map(t => t.trim())
                  .filter(Boolean)
              )
              .map((skill, i) => (
                <Badge
                  key={`${skill}-${i}`}
                  variant="outline"
                  className="h-auto max-w-full min-w-0 overflow-visible whitespace-normal wrap-break-word rounded-md py-1 font-normal text-xs leading-snug"
                >
                  {skill}
                </Badge>
              ))}
          </div>
        </DetailSection>
      )}

      <DetailSection title="Tags">
        <TagsSelector
          allTags={allTags}
          selectedIds={jobTags.map(t => t._id)}
          onChange={ids => {
            void updateJob(job._id, { tags: ids });
          }}
          compact
        />
      </DetailSection>

      <DetailSection title="Description">
        <RichText html={job.description} />
      </DetailSection>

      {requirements.length > 0 && (
        <DetailSection title="Requirements">
          <BulletList items={requirements} />
        </DetailSection>
      )}

      {responsibilities.length > 0 && (
        <DetailSection title="Responsibilities">
          <BulletList items={responsibilities} />
        </DetailSection>
      )}

      {benefits.length > 0 && (
        <DetailSection title="Benefits">
          <BulletList items={benefits} />
        </DetailSection>
      )}
    </div>
  );
}

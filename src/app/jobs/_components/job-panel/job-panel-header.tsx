import type { Job, JobStatus, PipelineTemplate } from '@/store';
import { BriefcaseIcon, MapPinIcon } from 'lucide-react';
import { JobHeaderActions } from './job-header-actions';
import { JobPipelineMenu } from './job-pipeline-menu';
import { JobPriorityBadge } from './job-priority-badge';
import { JobStatusMenu } from './job-status-menu';

interface JobPanelHeaderProps {
  job: Job;
  clientName: string;
  mutating: boolean;
  templates: PipelineTemplate[];
  currentTemplateId: string | null | undefined;
  onStatusChange: (status: JobStatus) => void;
  onPipelineMenuOpen: () => void;
  onSelectPipeline: (templateId: string) => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function JobPanelHeader({
  job,
  clientName,
  mutating,
  templates,
  currentTemplateId,
  onStatusChange,
  onPipelineMenuOpen,
  onSelectPipeline,
  onDelete,
  onEdit,
}: JobPanelHeaderProps) {
  return (
    <div className="relative px-6 py-5 flex items-start justify-between gap-4 border-b bg-card overflow-hidden">
      <div className="pointer-events-none absolute -top-10 -left-10 size-52 rounded-full bg-primary/[0.07] dark:bg-primary/[0.1] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 right-4 size-40 rounded-full bg-muted-foreground/[0.06] dark:bg-muted-foreground/[0.08] blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.055]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, currentColor 0, currentColor 0.5px, transparent 0, transparent 10px)',
        }}
      />
      <div className="relative min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <JobStatusMenu
            status={job.status}
            disabled={mutating}
            onChange={onStatusChange}
          />
          <JobPriorityBadge priority={job.priority} />
          <JobPipelineMenu
            templates={templates}
            currentTemplateId={currentTemplateId}
            disabled={mutating}
            onOpen={onPipelineMenuOpen}
            onSelect={onSelectPipeline}
          />
        </div>
        <p className="text-xl font-bold leading-snug truncate">{job.title}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BriefcaseIcon className="size-3 shrink-0" />
            {clientName}
          </span>
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="size-3 shrink-0" />
              {job.location}
            </span>
          )}
        </div>
      </div>
      <JobHeaderActions
        jobId={job._id}
        jobTitle={job.title}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  );
}

import { HeaderBackdrop } from '@/components/header-backdrop';
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
      <HeaderBackdrop />
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

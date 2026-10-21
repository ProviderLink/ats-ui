import { Badge } from '@/components/ui/badge';
import {
  jobPriorityLabel,
  jobStatusLabel,
  locationTypeLabel,
} from '@/lib/job-format';
import { JOB_STATUS_VARIANT } from '@/lib/status-styles';
import { cn } from '@/lib/utils';
import type { Job, JobPriority } from '@/store';
import { BuildingIcon, FlagIcon, UserIcon } from 'lucide-react';

// Flag + label coloured by severity, so priority reads without a legend.
const PRIORITY_CLS: Record<JobPriority, string> = {
  low: 'text-muted-foreground',
  medium: 'text-amber-600 dark:text-amber-400',
  high: 'text-pine-teal-600 dark:text-pine-teal-400',
  urgent: 'text-destructive font-semibold',
};

function PriorityFlag({ priority }: { priority: JobPriority }) {
  return (
    <span
      className={cn(
        'ml-auto flex items-center gap-1 font-medium',
        PRIORITY_CLS[priority]
      )}
      title={`Priority: ${jobPriorityLabel[priority]}`}
    >
      <FlagIcon
        className="size-3"
        fill={priority === 'low' ? 'none' : 'currentColor'}
        aria-hidden
      />
      {jobPriorityLabel[priority]}
    </span>
  );
}

interface JobListItemProps {
  job: Job;
  clientName?: string;
  candidateCount: number;
  selected: boolean;
  onSelect: () => void;
}

export function JobListItem({
  job,
  clientName,
  candidateCount,
  selected,
  onSelect,
}: JobListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group w-full text-left px-4 py-3 border border-dashed transition-colors',
        selected
          ? 'bg-foreground/[0.06] border-foreground/60'
          : 'border-transparent hover:bg-foreground/[0.04] hover:border-foreground/25'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-sm leading-snug">{job.title}</span>
        <Badge variant={JOB_STATUS_VARIANT[job.status]}>
          {jobStatusLabel[job.status]}
        </Badge>
      </div>
      {clientName && (
        <p
          title={clientName}
          className={cn(
            'mt-0.5 flex items-center gap-1 text-xs transition-colors',
            selected
              ? 'text-foreground/60'
              : 'text-muted-foreground/80 group-hover:text-foreground/60'
          )}
        >
          <BuildingIcon className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{clientName}</span>
        </p>
      )}
      <div
        className={cn(
          'mt-1.5 flex items-center gap-2 text-xs transition-colors',
          selected
            ? 'text-foreground/55'
            : 'text-muted-foreground group-hover:text-foreground/55'
        )}
      >
        <span>{locationTypeLabel[job.locationType]}</span>
        <span>·</span>
        <span>
          {job.openings} opening{job.openings !== 1 ? 's' : ''}
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <UserIcon className="size-3" />
          {candidateCount} candidate{candidateCount !== 1 ? 's' : ''}
        </span>
        <PriorityFlag priority={job.priority} />
      </div>
    </button>
  );
}

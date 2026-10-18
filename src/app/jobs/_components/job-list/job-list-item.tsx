import { Badge } from '@/components/ui/badge';
import { jobStatusLabel, locationTypeLabel } from '@/lib/job-format';
import { JOB_STATUS_VARIANT } from '@/lib/status-styles';
import { cn } from '@/lib/utils';
import type { Job } from '@/store';
import { UserIcon } from 'lucide-react';

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
        'group w-full text-left px-4 py-3 transition-colors hover:bg-foreground/[0.04]',
        selected
          ? 'bg-foreground/[0.06] border-r-2 border-r-primary'
          : 'border-r-2 border-r-transparent'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-sm leading-snug">{job.title}</span>
        <Badge variant={JOB_STATUS_VARIANT[job.status]}>
          {jobStatusLabel[job.status]}
        </Badge>
      </div>
      <p
        className={cn(
          'mt-0.5 text-sm transition-colors',
          selected
            ? 'text-foreground/70'
            : 'text-muted-foreground group-hover:text-foreground/70'
        )}
      >
        {clientName ?? '—'}
      </p>
      <div
        className={cn(
          'mt-1 flex items-center gap-2 text-xs transition-colors',
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
      </div>
    </button>
  );
}

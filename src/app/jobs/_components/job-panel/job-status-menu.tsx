import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { jobStatusLabel } from '@/lib/job-format';
import { JOB_STATUS_VARIANT } from '@/lib/status-styles';
import type { JobStatus } from '@/store';
import { ChevronDownIcon } from 'lucide-react';

interface JobStatusMenuProps {
  status: JobStatus;
  disabled: boolean;
  onChange: (status: JobStatus) => void;
}

export function JobStatusMenu({ status, disabled, onChange }: JobStatusMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group inline-flex items-center gap-1.5 h-7 rounded-full border border-border/70 bg-muted/40 pl-2 pr-1.5 text-sm shadow-xs transition-all duration-200 hover:bg-muted/70 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
          aria-label={`Change status (current: ${jobStatusLabel[status]})`}
        >
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Status
          </span>
          <Badge
            variant={JOB_STATUS_VARIANT[status]}
            className="text-[11px] h-5 px-2 cursor-pointer select-none"
          >
            {jobStatusLabel[status]}
          </Badge>
          <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel className="text-xs">Change Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(jobStatusLabel) as JobStatus[]).map(s => (
          <DropdownMenuItem
            key={s}
            disabled={s === status}
            onClick={() => onChange(s)}
            className="text-sm"
          >
            <Badge
              variant={JOB_STATUS_VARIANT[s]}
              className="text-[10px] h-4 px-1.5 mr-2"
            >
              {jobStatusLabel[s]}
            </Badge>
            {s === status && (
              <span className="ml-auto text-xs text-muted-foreground">
                current
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { jobStatusLabel } from '@/lib/job-format';
import { cn } from '@/lib/utils';
import type { JobStatus } from '@/store';
import { ChevronDownIcon, CircleDotIcon } from 'lucide-react';

interface JobStatusFilterProps {
  status?: JobStatus;
  onChange: (status?: JobStatus) => void;
}

const OPTIONS = ['all', 'open', 'draft', 'on_hold', 'closed'] as const;

export function JobStatusFilter({ status, onChange }: JobStatusFilterProps) {
  return (
    <div className="px-3 py-2 border-b flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 gap-1.5 rounded-full text-xs border-dashed',
              status && 'border-solid border-primary text-primary'
            )}
          >
            <CircleDotIcon className="size-3" />
            {status ? `Status: ${jobStatusLabel[status]}` : 'Status'}
            <ChevronDownIcon className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {OPTIONS.map(s => (
            <DropdownMenuItem
              key={s}
              onSelect={() => onChange(s === 'all' ? undefined : s)}
              className={cn(
                'text-sm',
                (status ?? 'all') === s && 'font-medium text-primary'
              )}
            >
              {s === 'all' ? 'All Status' : jobStatusLabel[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {status && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={() => onChange(undefined)}
        >
          Clear filter
        </Button>
      )}
    </div>
  );
}

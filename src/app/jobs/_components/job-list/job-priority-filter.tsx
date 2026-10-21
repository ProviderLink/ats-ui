import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { jobPriorityLabel } from '@/lib/job-format';
import { cn } from '@/lib/utils';
import type { JobPriority } from '@/store';
import { ChevronDownIcon, FlagIcon } from 'lucide-react';

interface JobPriorityFilterProps {
  priority?: JobPriority;
  onChange: (priority?: JobPriority) => void;
}

const OPTIONS = ['all', 'urgent', 'high', 'medium', 'low'] as const;

export function JobPriorityFilter({
  priority,
  onChange,
}: JobPriorityFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-7 gap-1.5 rounded-full text-xs border-dashed',
            priority && 'border-solid border-primary text-primary'
          )}
        >
          <FlagIcon className="size-3" />
          {priority ? `Priority: ${jobPriorityLabel[priority]}` : 'Priority'}
          <ChevronDownIcon className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {OPTIONS.map(p => (
          <DropdownMenuItem
            key={p}
            onSelect={() => onChange(p === 'all' ? undefined : p)}
            className={cn(
              'text-sm',
              (priority ?? 'all') === p && 'font-medium text-primary'
            )}
          >
            {p === 'all' ? 'All Priorities' : jobPriorityLabel[p]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

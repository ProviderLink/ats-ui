import { Badge } from '@/components/ui/badge';
import { jobPriorityLabel } from '@/lib/job-format';
import { cn } from '@/lib/utils';
import type { JobPriority } from '@/store';
import { FlagIcon } from 'lucide-react';

const PRIORITY_VARIANT: Record<
  JobPriority,
  'secondary' | 'outline' | 'default' | 'destructive'
> = {
  low: 'secondary',
  medium: 'outline',
  high: 'default',
  urgent: 'destructive',
};

// The chip colour carries severity so it does not rely on the word alone.
const PRIORITY_CLS: Record<JobPriority, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  medium:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40',
  high: 'bg-pine-teal-100 text-pine-teal-800 border-pine-teal-200 dark:bg-pine-teal-900/30 dark:text-pine-teal-300 dark:border-pine-teal-800/40',
  urgent: 'bg-destructive/10 text-destructive border-destructive/30',
};

export function JobPriorityBadge({ priority }: { priority: JobPriority }) {
  return (
    <Badge
      variant={PRIORITY_VARIANT[priority]}
      className={cn(
        'text-[11px] h-6 px-2 gap-1.5 rounded-full border shadow-xs',
        PRIORITY_CLS[priority]
      )}
      title={`Priority: ${jobPriorityLabel[priority]}`}
    >
      <FlagIcon className="size-2.5" />
      <span className="hidden sm:inline">Priority:</span>
      {jobPriorityLabel[priority]}
    </Badge>
  );
}

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import { BriefcaseIcon, MailIcon, StarIcon } from 'lucide-react';

interface HiredRowActionsProps {
  candidate: Candidate;
  mutating: boolean;
  onAssign: () => void;
  onEmail: () => void;
  onToggleTalentPool: () => void;
}

export function HiredRowActions({
  candidate,
  mutating,
  onAssign,
  onEmail,
  onToggleTalentPool,
}: HiredRowActionsProps) {
  const name = `${candidate.firstName} ${candidate.lastName}`;
  const inPool = !!candidate.inTalentPool;

  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-xs"
              className="rounded p-2 border-teal-300 bg-teal-100 text-teal-800 hover:bg-teal-200 hover:text-teal-900 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
              onClick={onAssign}
              aria-label={`Assign ${name} to a job`}
            >
              <BriefcaseIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Assign to a new job</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-xs"
              className="rounded p-2 border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 hover:border-blue-400 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
              disabled={!candidate.email || mutating}
              onClick={onEmail}
              aria-label={`Email ${name}`}
            >
              <MailIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {candidate.email ? 'Email candidate' : 'No email address'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-xs"
              className="rounded p-2 border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200 hover:text-amber-900 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
              disabled={mutating}
              onClick={onToggleTalentPool}
              aria-label={`${inPool ? 'Remove' : 'Add'} ${name} ${inPool ? 'from' : 'to'} the talent pool`}
            >
              <StarIcon className={cn('size-3.5', inPool && 'fill-current')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {inPool ? 'Remove from talent pool' : 'Add to talent pool'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

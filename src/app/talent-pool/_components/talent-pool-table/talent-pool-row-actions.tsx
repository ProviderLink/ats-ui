import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Candidate } from '@/store/types';
import { BriefcaseIcon, MailIcon, XIcon } from 'lucide-react';

interface TalentPoolRowActionsProps {
  candidate: Candidate;
  mutating: boolean;
  onRemove: () => void;
  onAssign: () => void;
  onEmail: () => void;
}

export function TalentPoolRowActions({
  candidate,
  mutating,
  onRemove,
  onAssign,
  onEmail,
}: TalentPoolRowActionsProps) {
  const name = `${candidate.firstName} ${candidate.lastName}`;

  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-xs"
              className="rounded p-2 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40 dark:hover:bg-destructive/10 dark:hover:border-destructive/40"
              disabled={mutating}
              onClick={onRemove}
              aria-label={`Remove ${name} from the talent pool`}
            >
              <XIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Remove from talent pool</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-xs"
              className="rounded p-2 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
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
              className="rounded p-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 dark:hover:border-blue-700/40"
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
    </div>
  );
}

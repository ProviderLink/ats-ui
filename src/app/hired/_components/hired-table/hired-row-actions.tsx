import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Candidate } from '@/store/types';
import { BriefcaseIcon, EllipsisIcon, MailIcon, StarIcon } from 'lucide-react';

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

  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-xs"
              className="rounded p-2 hover:bg-accent hover:text-accent-foreground"
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
              className="rounded p-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className="rounded p-2"
            aria-label={`More actions for ${name}`}
          >
            <EllipsisIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem className="gap-2.5" onClick={onToggleTalentPool}>
            <StarIcon className="size-3.5" />
            {candidate.inTalentPool
              ? 'Remove from Talent Pool'
              : 'Add to Talent Pool'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

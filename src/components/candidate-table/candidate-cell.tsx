import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserStore } from '@/store/slices/users.store';
import type { Candidate } from '@/store/types';
import { ShieldCheckIcon, StarIcon } from 'lucide-react';

export function CandidateCell({ candidate }: { candidate: Candidate }) {
  const allUsers = useUserStore(s => s.items);
  const hasCrm = allUsers.some(
    u =>
      u.candidateRef === candidate._id &&
      u.appAccess?.includes('crm') &&
      u.isActive
  );
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight truncate flex items-center gap-1">
          {candidate.firstName} {candidate.lastName}
          {hasCrm && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5 rounded-full border border-pine-teal-500/60 bg-pine-teal-100 px-1.5 py-0.5 text-[9px] font-semibold text-pine-teal-800 dark:border-pine-teal-500/30 dark:bg-pine-teal-950/40 dark:text-pine-teal-400 shrink-0 select-none">
                  <ShieldCheckIcon className="size-2.5" />
                  CRM
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                CRM access active
              </TooltipContent>
            </Tooltip>
          )}
          {candidate.inTalentPool && (
            <Tooltip>
              <TooltipTrigger asChild>
                <StarIcon className="size-3 shrink-0 fill-violet-600 text-violet-600 dark:fill-violet-400 dark:text-violet-400 cursor-default" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                In Talent Pool
              </TooltipContent>
            </Tooltip>
          )}
          {candidate.eligibilityStatus === 'permanently_ineligible' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center shrink-0 rounded-full border border-red-500/60 bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400 select-none">
                  INELIGIBLE
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Permanently Ineligible
              </TooltipContent>
            </Tooltip>
          )}
          {candidate.legalHold && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center shrink-0 rounded-full border border-amber-500/60 bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400 select-none">
                  HOLD
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Legal hold
              </TooltipContent>
            </Tooltip>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {candidate.email}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
          <span>{candidate.yearsOfExperience} yrs exp</span>
          {candidate.currentSalaryUSD != null && (
            <span className="text-[11px] font-medium text-foreground/80">
              ·{' '}
              {`$${(candidate.currentSalaryUSD / 1000).toFixed(candidate.currentSalaryUSD % 1000 === 0 ? 0 : 1)}K`}
              /mo
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

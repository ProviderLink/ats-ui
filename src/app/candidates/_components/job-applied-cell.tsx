import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Candidate, Client, Job } from '@/store/types';

interface JobAppliedCellProps {
  candidate: Candidate;
  /** Jobs from the candidate's live and hired applications. */
  appInfos?: { jobTitle: string; clientName: string }[];
  allJobs: Job[];
  allClients: Client[];
}

export function JobAppliedCell({
  candidate,
  appInfos,
  allJobs,
  allClients,
}: JobAppliedCellProps) {
  // Try app-based lookup first (candidates with an application)
  if (appInfos && appInfos.length > 0) {
    const first = appInfos[0];
    const rest = appInfos.slice(1);
    return (
      <div className="flex items-start gap-1.5 min-w-35 max-w-55 rounded-sm border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30 px-2 py-1 -my-1">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium whitespace-normal leading-tight">
            {first.jobTitle}
          </p>
          {first.clientName && (
            <p className="text-[11px] text-muted-foreground whitespace-normal leading-tight mt-0.5">
              {first.clientName}
            </p>
          )}
        </div>
        {rest.length > 0 && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1 h-4 cursor-default shrink-0"
                >
                  +{rest.length}
                </Badge>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="text-xs max-w-56"
              >
                {rest.map(i => i.jobTitle).join(', ')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }
  // Fallback: pending candidates have appliedJobId but no application yet
  const appliedJobId = candidate.appliedJobId;
  if (appliedJobId) {
    const job = allJobs.find(j => j._id === appliedJobId);
    const clientName = job
      ? (allClients.find(c => c._id === job.clientId)?.companyName ??
        '')
      : '';
    return (
      <div className="flex items-start gap-1.5 min-w-35 max-w-55 rounded-sm border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30 px-2 py-1 -my-1">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium whitespace-normal leading-tight">
            {job?.title ?? appliedJobId}
          </p>
          {clientName && (
            <p className="text-[11px] text-muted-foreground whitespace-normal leading-tight mt-0.5">
              {clientName}
            </p>
          )}
        </div>
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}

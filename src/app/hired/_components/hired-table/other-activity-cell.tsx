import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BriefcaseIcon, StarIcon } from 'lucide-react';
import type { OtherActivity } from '../../_utils/hired-data';

export function OtherActivityCell({ info }: { info: OtherActivity | undefined }) {
  const inPipeline = info?.inPipeline ?? 0;
  const inTalentPool = info?.inTalentPool ?? false;
  if (inPipeline === 0 && !inTalentPool)
    return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {inPipeline > 0 && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="h-5 gap-1 border-blue-200 bg-blue-50 text-[10px] font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
              >
                <BriefcaseIcon className="size-2.5" />
                {inPipeline} pipeline
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Also active in {inPipeline}{' '}
              {inPipeline === 1 ? 'pipeline' : 'pipelines'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {inTalentPool && (
        <Badge
          variant="outline"
          className="h-5 gap-1 border-violet-200 bg-violet-50 text-[10px] font-medium text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300"
        >
          <StarIcon className="size-2.5" />
          Pool
        </Badge>
      )}
    </div>
  );
}

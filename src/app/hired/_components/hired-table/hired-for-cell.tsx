import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';
import type { HireInfo } from '../../_utils/hired-data';

export function HiredForCell({ infos }: { infos: HireInfo[] | undefined }) {
  if (!infos || infos.length === 0)
    return <span className="text-xs text-muted-foreground">—</span>;
  const [first, ...rest] = infos;
  return (
    <div className="flex items-start gap-1.5 min-w-35 max-w-55 rounded-sm border border-emerald-400 bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-2 py-1 -my-1">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium whitespace-normal leading-tight">
          {first.jobTitle}
        </p>
        {first.clientName && (
          <p className="text-[11px] text-emerald-900/70 dark:text-muted-foreground whitespace-normal leading-tight mt-0.5">
            {first.clientName}
          </p>
        )}
        <p className="text-[10px] font-medium text-emerald-800 dark:text-emerald-400 mt-0.5">
          {formatDate(first.hiredAt)}
        </p>
      </div>
      {rest.length > 0 && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-[10px] px-1 h-4 cursor-default shrink-0 bg-emerald-200 text-emerald-900 dark:bg-secondary dark:text-secondary-foreground"
              >
                +{rest.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-56">
              {rest.map(i => i.jobTitle).join(', ')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

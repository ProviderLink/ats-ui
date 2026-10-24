import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Candidate } from '@/store/types';
import { MousePointerClickIcon } from 'lucide-react';

export function SkillsCell({ candidate }: { candidate: Candidate }) {
  const skills = candidate.parsedData?.skills ?? [];
  if (skills.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const MAX = 3;
  const visible = skills.slice(0, MAX);
  const overflow = skills.length - MAX;
  return (
    <div className="flex items-center gap-1 flex-wrap min-w-0 max-w-48">
      {visible.map(skill => (
        <span
          key={skill}
          className="inline-flex items-center h-5 rounded-md border px-1.5 text-xs leading-none text-gray-700 border-gray-300 bg-gray-100 dark:text-muted-foreground dark:border-border dark:bg-muted/40 max-w-full"
        >
          <span className="truncate">{skill}</span>
        </span>
      ))}
      {overflow > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 h-5 shrink-0 rounded-md border px-1.5 text-xs leading-none text-gray-700 border-gray-400 bg-gray-100 dark:text-muted-foreground dark:border-border dark:bg-muted/40 cursor-default border-dashed">
              +{overflow} more
              <MousePointerClickIcon className="size-3 text-amber-600 dark:text-warning" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="p-2.5 max-w-72">
            <div className="flex flex-wrap gap-1">
              {skills.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center min-h-5 rounded-md border border-current/25 px-1.5 text-xs leading-snug text-current/85 whitespace-normal wrap-break-word"
                >
                  {s}
                </span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

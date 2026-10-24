import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusIcon } from 'lucide-react';

interface AddToAnotherJobButtonProps {
  disabled: boolean;
  hasOpenJobs: boolean;
  onClick: () => void;
}

/**
 * Wrapped in a span because a disabled button carries `pointer-events-none`,
 * so the tooltip would never fire on the button itself.
 */
export function AddToAnotherJobButton({
  disabled,
  hasOpenJobs,
  onClick,
}: AddToAnotherJobButtonProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={hasOpenJobs ? -1 : 0}>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              className="h-8 gap-1.5 border-emerald-400 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:text-emerald-900 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50 dark:hover:text-foreground"
              onClick={onClick}
            >
              <PlusIcon className="size-3.5" />
              Add to Another Job
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          {hasOpenJobs
            ? 'Add another job alongside the current one'
            : 'No other open jobs available'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

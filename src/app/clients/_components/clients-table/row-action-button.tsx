import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RowActionButtonProps {
  label: string;
  tooltip: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

export function RowActionButton({
  label,
  tooltip,
  icon,
  onClick,
  destructive,
}: RowActionButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon-xs"
            className={cn(
              'rounded-[3px] p-2 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground',
              destructive &&
                'text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40 dark:hover:bg-destructive/10 dark:hover:border-destructive/40'
            )}
            onClick={e => {
              e.stopPropagation();
              onClick();
            }}
            aria-label={label}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

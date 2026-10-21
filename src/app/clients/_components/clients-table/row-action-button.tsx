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
  tone?: 'edit' | 'view' | 'destructive';
}

// Hover steps the tint two shades deeper with a darker icon: clearly visible,
// still plain, and instant (transition-none on the button).
const TONE_CLS = {
  edit: 'bg-sky-100 text-sky-700 hover:bg-sky-300 hover:text-sky-900 dark:bg-sky-500/20 dark:text-sky-300 dark:hover:bg-sky-500/40',
  view: 'bg-pine-teal-100 text-pine-teal-700 hover:bg-pine-teal-300 hover:text-pine-teal-900 dark:bg-pine-teal-500/20 dark:text-pine-teal-300 dark:hover:bg-pine-teal-500/40',
  destructive:
    'bg-rose-100 text-rose-700 hover:bg-rose-300 hover:text-rose-900 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/40',
} as const;

export function RowActionButton({
  label,
  tooltip,
  icon,
  onClick,
  tone = 'view',
}: RowActionButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className={cn('size-7 squircle border-0 p-0 transition-none', TONE_CLS[tone])}
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

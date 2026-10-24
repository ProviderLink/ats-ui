import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IconActionButtonProps {
  label: string;
  tooltip?: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: Tone;
}

type Tone = 'blue' | 'emerald' | 'amber' | 'red';

// Light: tinted fill + border so the icon buttons read on white. Dark: the
// regular outline-button look with a coloured icon.
const TONE_CLS: Record<Tone, string> = {
  blue: 'border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 dark:border-input dark:bg-input/30 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300',
  emerald:
    'border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 dark:border-input dark:bg-input/30 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300',
  amber:
    'border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200 hover:text-amber-900 dark:border-input dark:bg-input/30 dark:text-amber-400 dark:hover:bg-amber-900/30 dark:hover:text-amber-300',
  red: 'border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 dark:border-input dark:bg-input/30 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300',
};

export function IconActionButton({
  label,
  tooltip = label,
  icon,
  onClick,
  disabled,
  tone = 'blue',
}: IconActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon-xs"
          aria-label={label}
          className={cn('rounded', TONE_CLS[tone])}
          disabled={disabled}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

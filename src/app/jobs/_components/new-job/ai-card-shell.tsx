import { cn } from '@/lib/utils';
import { ChevronDownIcon, SparklesIcon } from 'lucide-react';

interface AiCardShellProps {
  title: string;
  subtitle: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * `shrink-0` is required: the card is `overflow-hidden`, which makes its
 * automatic minimum size 0. As a child of the column flex scroll area it would
 * otherwise absorb all the shrink and collapse to a thin bordered line.
 */
export function AiCardShell({
  title,
  subtitle,
  expanded,
  onToggle,
  children,
}: AiCardShellProps) {
  return (
    <div className="shrink-0 overflow-hidden rounded-lg border bg-muted/30 dark:bg-white/2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/30"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <SparklesIcon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="block text-xs text-muted-foreground">
            {subtitle}
          </span>
        </span>
        <ChevronDownIcon
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>
      {expanded && (
        <div className="flex flex-col gap-2 border-t px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

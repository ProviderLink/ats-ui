import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/** Soft grey surface used for read-only panels and grouped settings. */
export const PANEL_CLS =
  'rounded-lg border border-gray-200 bg-gray-50 dark:border-border dark:bg-white/3';

/** Rounded tile that carries the icon in a dialog / sheet header. */
export function IconTile({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-lg bg-pine-teal-100 text-pine-teal-700 dark:bg-pine-teal-900/40 dark:text-pine-teal-300',
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

/** Small uppercase heading that introduces a block of a form or a view. */
export function SectionHeading({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h3>
      {action}
    </div>
  );
}

const PILL_TONES = {
  neutral:
    'border-gray-300 bg-gray-100 text-gray-800 dark:border-border dark:bg-transparent dark:text-foreground',
  amber:
    'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  emerald:
    'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
} as const;

/** Compact status pill; same size everywhere so header badges line up. */
export function Pill({
  tone = 'neutral',
  icon: Icon,
  children,
}: {
  tone?: keyof typeof PILL_TONES;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'h-5 gap-1 px-2 py-0 text-[11px] leading-none font-medium',
        PILL_TONES[tone],
      )}
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </Badge>
  );
}

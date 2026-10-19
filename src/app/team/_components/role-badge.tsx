import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ROLE_LABELS } from '@/lib/role-labels';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/store/types/enums';

// Hues avoid the green / amber / red the account-status pill uses, so a role
// is never read as a status. Class names are written out in full for Tailwind.
const ROLE_TONES: Record<UserRole, string> = {
  admin:
    'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/40 dark:bg-violet-950/40 dark:text-violet-300',
  hiring_manager:
    'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-300',
  recruiter:
    'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-950/40 dark:text-cyan-300',
  coordinator:
    'border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-500/40 dark:bg-pink-950/40 dark:text-pink-300',
  interviewer:
    'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-300',
  account_manager:
    'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-300',
  client:
    'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/40 dark:bg-slate-800/50 dark:text-slate-300',
  va: 'border-stone-300 bg-stone-100 text-stone-700 dark:border-stone-500/40 dark:bg-stone-800/50 dark:text-stone-300',
};

const FALLBACK_TONE = 'border-border bg-muted text-muted-foreground';

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium',
        ROLE_TONES[role as UserRole] ?? FALLBACK_TONE
      )}
    >
      {ROLE_LABELS[role as UserRole] ?? role}
    </span>
  );
}

/**
 * The roles a member holds. With `maxVisible`, extra roles collapse into a
 * "+N" chip (full list on hover) so a table cell keeps one fixed-height line.
 */
export function RoleBadges({
  roles,
  className,
  maxVisible,
}: {
  roles: string[] | undefined;
  className?: string;
  maxVisible?: number;
}) {
  if (!roles || roles.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  const limit = maxVisible ?? roles.length;
  const shown = roles.slice(0, limit);
  const hidden = roles.slice(limit);
  return (
    <div
      className={cn(
        'flex gap-1.5',
        maxVisible === undefined ? 'flex-wrap' : 'flex-nowrap',
        className
      )}
    >
      {shown.map(r => (
        <RoleBadge key={r} role={r} />
      ))}
      {hidden.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-default items-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              +{hidden.length}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            {hidden.map(r => ROLE_LABELS[r as UserRole] ?? r).join(', ')}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

import { cn } from '@/lib/utils';

export function StatusBadge({
  isActive,
  isInviteAccepted,
}: {
  isActive: boolean;
  isInviteAccepted: boolean;
}) {
  const invited = isActive && !isInviteAccepted;
  const variant = invited ? 'invited' : isActive ? 'active' : 'inactive';

  const colors = {
    active: 'border-[#69c58a]/60 text-[#2d8a51] dark:text-[#69c58a]',
    inactive: 'border-rose-400/60 text-rose-600 dark:text-rose-400',
    invited: 'border-amber-400/60 text-amber-600 dark:text-amber-400',
  };

  const dotColors = {
    active: 'bg-[#69c58a]',
    inactive: 'bg-rose-500 dark:bg-rose-400',
    invited: 'bg-amber-500 dark:bg-amber-400',
  };

  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    invited: 'Invited',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colors[variant]
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotColors[variant])} />
      {labels[variant]}
    </span>
  );
}

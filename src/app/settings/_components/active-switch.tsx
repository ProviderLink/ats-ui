import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/**
 * Active / Inactive toggle for a template row. A switch plus a status word reads
 * as "this is a state you can flip", which the old Power-icon button did not.
 */
export function ActiveSwitch({
  active,
  disabled,
  label,
  onToggle,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        'inline-flex h-7 items-center gap-2 text-xs font-medium',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      )}
    >
      <Switch
        checked={active}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={label}
        className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-primary dark:data-[state=unchecked]:bg-input"
      />
      <span
        className={cn(
          'w-12',
          active
            ? 'text-emerald-700 dark:text-primary'
            : 'text-gray-600 dark:text-muted-foreground',
        )}
      >
        {active ? 'Active' : 'Inactive'}
      </span>
    </label>
  );
}

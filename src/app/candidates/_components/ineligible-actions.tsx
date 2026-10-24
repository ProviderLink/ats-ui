import { Button } from '@/components/ui/button';
import { ShieldAlertIcon, ShieldOffIcon, Trash2Icon } from 'lucide-react';

/**
 * IneligibleActions
 *
 * Footer bar for a permanently ineligible candidate. This state has no pipeline
 * and no application, so the pending/approved/hired toolbars do not apply — the
 * only two things an admin can do here are restore them (which clears
 * ineligibility and lands them in In Review for a chosen job) or delete them
 * outright, the single permanent-delete path in the ATS.
 */
export function IneligibleActions({
  legalHold,
  onToggleLegalHold,
  onRestore,
  onDelete,
  disabled,
}: {
  legalHold: boolean;
  onToggleLegalHold: () => void;
  onRestore: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200 hover:text-amber-900 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50 dark:hover:text-foreground"
        onClick={onToggleLegalHold}
      >
        {legalHold ? (
          <ShieldOffIcon className="size-3.5" />
        ) : (
          <ShieldAlertIcon className="size-3.5" />
        )}
        {legalHold ? 'Remove Legal Hold' : 'Place Legal Hold'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 border-emerald-400 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:text-emerald-900 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50 dark:hover:text-foreground"
        onClick={onRestore}
      >
        <ShieldOffIcon className="size-3.5" />
        Restore
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 dark:border-input dark:bg-input/30 dark:text-destructive dark:hover:bg-destructive/10"
        onClick={onDelete}
      >
        <Trash2Icon className="size-3.5" />
        Delete Permanently
      </Button>
    </div>
  );
}

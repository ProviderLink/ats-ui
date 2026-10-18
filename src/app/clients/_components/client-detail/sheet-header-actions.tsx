import { Button } from '@/components/ui/button';
import type { User } from '@/store/types/user.types';
import { PencilIcon, ShieldCheckIcon, Trash2Icon, XCircleIcon } from 'lucide-react';

interface SheetHeaderActionsProps {
  canProvision: boolean;
  crmUser?: User;
  busy: boolean;
  onProvision: () => void;
  onRevoke: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SheetHeaderActions({
  canProvision,
  crmUser,
  busy,
  onProvision,
  onRevoke,
  onEdit,
  onDelete,
}: SheetHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {canProvision && !crmUser && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={onProvision}
          disabled={busy}
          title="Send CRM portal invite to this client's primary contact"
        >
          <ShieldCheckIcon className="size-3 text-muted-foreground" />
          {busy ? '…' : 'Give CRM Access'}
        </Button>
      )}
      {crmUser && (
        <>
          <span className="inline-flex items-center gap-1 rounded-full border border-pine-teal-500/40 bg-pine-teal-50 px-2 py-0.5 text-[11px] font-medium text-pine-teal-700 dark:bg-pine-teal-950/50 dark:text-pine-teal-400">
            <ShieldCheckIcon className="size-3" />
            CRM Active
            {!crmUser.isInviteAccepted && (
              <span className="text-amber-600 dark:text-amber-400 ml-0.5">
                (invited)
              </span>
            )}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
            onClick={onRevoke}
            disabled={busy}
            title="Remove CRM portal access from this client"
          >
            <XCircleIcon className="size-3" />
            {busy ? '…' : 'Revoke'}
          </Button>
        </>
      )}
      {onEdit && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={onEdit}
        >
          <PencilIcon className="size-3" />
          Edit
        </Button>
      )}
      {onDelete && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
          onClick={onDelete}
        >
          <Trash2Icon className="size-3" />
          Delete
        </Button>
      )}
    </div>
  );
}

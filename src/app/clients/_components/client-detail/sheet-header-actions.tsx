import { Button } from "@/components/ui/button";
import type { User } from "@/store/types/user.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { PencilIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react";

interface SheetHeaderActionsProps {
  canProvision: boolean;
  crmUser?: User;
  busy: boolean;
  onProvision: () => void;
  onRevoke: () => void | Promise<void>;
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
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onEdit && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-border bg-muted/50 hover:bg-muted dark:bg-input/30"
          onClick={onEdit}
        >
          <PencilIcon className="size-3.5" />
          Edit
        </Button>
      )}
      {canProvision && !crmUser && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-border bg-muted/50 hover:bg-muted dark:bg-input/30"
          onClick={onProvision}
          disabled={busy}
          title="Send CRM portal invite to this client's primary contact"
        >
          <ShieldCheckIcon className="size-3.5" />
          {busy ? "Sending…" : "Give CRM access"}
        </Button>
      )}
      {crmUser && (
        <div className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-muted/50 pl-2.5 pr-1 text-xs">
          <ShieldCheckIcon className="size-3.5 text-pine-teal-600 dark:text-pine-teal-400" />
          <span className="font-medium">
            {crmUser.isInviteAccepted ? "CRM access" : "CRM invited"}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 border-destructive/30 bg-background px-2 text-xs text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmRevoke(true)}
            disabled={busy}
            title="Remove CRM portal access from this client"
          >
            {busy ? "…" : "Revoke"}
          </Button>
        </div>
      )}
      {onDelete && (
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 gap-1.5 border-destructive/30 bg-destructive/5 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2Icon className="size-3.5" />
          Delete
        </Button>
      )}
      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke CRM access?</DialogTitle>
            <DialogDescription>
              This client will no longer be able to sign in to the CRM portal.
              You can give access again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmRevoke(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={busy}
              onClick={async () => {
                await onRevoke();
                setConfirmRevoke(false);
              }}
            >
              {busy ? "Revoking…" : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

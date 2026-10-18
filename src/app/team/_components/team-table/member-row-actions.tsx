import { Button } from '@/components/ui/button';
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react';

interface MemberRowActionsProps {
  confirming: boolean;
  mutating: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export function MemberRowActions({
  confirming,
  mutating,
  onEdit,
  onAskDelete,
  onConfirmDelete,
  onCancelDelete,
}: MemberRowActionsProps) {
  if (confirming) {
    return (
      <div className="flex items-center gap-1 min-w-40">
        <span className="text-xs text-muted-foreground mr-1">Delete?</span>
        <Button
          variant="destructive"
          size="xs"
          className="h-7 gap-1 px-2"
          disabled={mutating}
          onClick={onConfirmDelete}
        >
          <CheckIcon className="size-3" />
          Yes
        </Button>
        <Button
          variant="outline"
          size="xs"
          className="h-7 gap-1 px-2"
          onClick={onCancelDelete}
        >
          <XIcon className="size-3" />
          No
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 min-w-40">
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
        onClick={onEdit}
      >
        <PencilIcon className="size-3" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
        onClick={onAskDelete}
      >
        <Trash2Icon className="size-3" />
        Delete
      </Button>
    </div>
  );
}

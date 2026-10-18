import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpenIcon,
  CheckIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';

interface TeamToolbarProps {
  selectedCount: number;
  mutating: boolean;
  onDeleteSelected: () => Promise<void>;
  onOpenPermissions: () => void;
  onInvite: () => void;
}

export function TeamToolbar({
  selectedCount,
  mutating,
  onDeleteSelected,
  onOpenPermissions,
  onInvite,
}: TeamToolbarProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap shrink-0">
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        {selectedCount > 0 &&
          (confirmingDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                Delete {selectedCount} member{selectedCount > 1 ? 's' : ''}?
              </span>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 gap-1 px-2 text-xs"
                disabled={mutating}
                onClick={async () => {
                  await onDeleteSelected();
                  setConfirmingDelete(false);
                }}
              >
                <CheckIcon className="size-3" />
                Yes
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setConfirmingDelete(false)}
              >
                <XIcon className="size-3" />
                No
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="h-7 rounded-md px-2 text-xs">
                {selectedCount} selected
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2Icon className="size-3" />
                Delete selected
              </Button>
            </div>
          ))}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-xs"
          onClick={onOpenPermissions}
        >
          <BookOpenIcon className="size-3.5" />
          Permissions
        </Button>
        <Button size="sm" className="h-8 gap-1 text-xs" onClick={onInvite}>
          <PlusIcon className="size-3.5" />
          Add User
        </Button>
      </div>
    </div>
  );
}

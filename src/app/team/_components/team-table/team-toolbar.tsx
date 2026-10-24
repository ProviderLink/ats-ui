import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpenIcon, PlusIcon, Trash2Icon } from 'lucide-react';
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
  const [confirmCount, setConfirmCount] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-2 flex-wrap shrink-0">
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="h-7 rounded-md px-2 text-xs border border-gray-300 bg-gray-200 text-gray-800 dark:border-transparent dark:bg-secondary dark:text-secondary-foreground">
              {selectedCount} selected
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2 text-xs border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 hover:border-red-400 dark:border-input dark:bg-input/30 dark:text-destructive dark:hover:bg-destructive/10 dark:hover:border-destructive/40"
              onClick={() => setConfirmCount(selectedCount)}
            >
              <Trash2Icon className="size-3" />
              Delete selected
            </Button>
          </div>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-xs border-pine-teal-400 bg-pine-teal-100 text-pine-teal-800 hover:bg-pine-teal-200 hover:text-pine-teal-900 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
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

      <ConfirmDialog
        open={confirmCount !== null}
        onOpenChange={open => !open && setConfirmCount(null)}
        title={`Delete ${confirmCount ?? 0} member${confirmCount === 1 ? '' : 's'}?`}
        description="The selected team members will be removed. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={mutating}
        onConfirm={async () => {
          await onDeleteSelected();
          setConfirmCount(null);
        }}
      />
    </div>
  );
}

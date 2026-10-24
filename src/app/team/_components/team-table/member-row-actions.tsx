import { Button } from '@/components/ui/button';
import { PencilIcon, Trash2Icon } from 'lucide-react';

interface MemberRowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function MemberRowActions({ onEdit, onDelete }: MemberRowActionsProps) {
  return (
    <div className="flex items-center gap-1 min-w-40">
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-xs border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 hover:border-blue-400 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-primary/10 dark:hover:text-primary dark:hover:border-primary/30"
        onClick={onEdit}
      >
        <PencilIcon className="size-3" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-xs border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 hover:border-red-400 dark:border-input dark:bg-input/30 dark:text-destructive dark:hover:bg-destructive/10 dark:hover:border-destructive/40"
        onClick={onDelete}
      >
        <Trash2Icon className="size-3" />
        Delete
      </Button>
    </div>
  );
}

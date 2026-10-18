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
        onClick={onDelete}
      >
        <Trash2Icon className="size-3" />
        Delete
      </Button>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckIcon, Trash2Icon, XIcon } from 'lucide-react';

interface TagsBulkActionsProps {
  selectedCount: number;
  confirming: boolean;
  mutating: boolean;
  onAskConfirm: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function TagsBulkActions({
  selectedCount,
  confirming,
  mutating,
  onAskConfirm,
  onCancel,
  onConfirm,
}: TagsBulkActionsProps) {
  if (selectedCount === 0) return null;

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          Delete {selectedCount} tag{selectedCount > 1 ? 's' : ''}?
        </span>
        <Button
          size="sm"
          variant="destructive"
          className="h-7 gap-1 px-2 text-xs"
          disabled={mutating}
          onClick={onConfirm}
        >
          <CheckIcon className="size-3" />
          Yes
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-xs"
          onClick={onCancel}
        >
          <XIcon className="size-3" />
          No
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="secondary" className="h-7 rounded-md px-2 text-xs">
        {selectedCount} selected
      </Badge>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
        onClick={onAskConfirm}
      >
        <Trash2Icon className="size-3" />
        Delete selected
      </Button>
    </div>
  );
}

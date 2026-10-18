import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2Icon } from 'lucide-react';

interface TagsBulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
}

export function TagsBulkActions({
  selectedCount,
  onDelete,
}: TagsBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="secondary" className="h-7 rounded-md px-2 text-xs">
        {selectedCount} selected
      </Badge>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
        onClick={onDelete}
      >
        <Trash2Icon className="size-3" />
        Delete selected
      </Button>
    </div>
  );
}

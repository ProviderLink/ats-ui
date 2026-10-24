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
      <Badge
        variant="secondary"
        className="h-7 rounded-md border border-gray-300 bg-gray-200 px-2 text-xs text-gray-800 dark:border-transparent dark:bg-secondary dark:text-secondary-foreground"
      >
        {selectedCount} selected
      </Badge>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 px-2 text-xs border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 hover:border-red-400 dark:border-input dark:bg-input/30 dark:text-destructive dark:hover:bg-destructive/10 dark:hover:border-destructive/40"
        onClick={onDelete}
      >
        <Trash2Icon className="size-3" />
        Delete selected
      </Button>
    </div>
  );
}

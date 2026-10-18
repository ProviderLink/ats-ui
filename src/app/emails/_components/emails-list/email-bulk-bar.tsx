import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2Icon, XIcon } from 'lucide-react';

interface EmailBulkBarProps {
  selectedCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function EmailBulkBar({
  selectedCount,
  allSelected,
  onToggleAll,
  onDelete,
  onClear,
}: EmailBulkBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs shrink-0">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onToggleAll}
          aria-label="Select all visible"
          className="size-4"
        />
        <Badge variant="secondary" className="text-xs">
          {selectedCount} selected
        </Badge>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onDelete}
      >
        <Trash2Icon className="size-4" />
        Delete selected
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="ml-auto text-muted-foreground"
        onClick={onClear}
      >
        <XIcon className="size-4" />
        Clear
      </Button>
    </div>
  );
}

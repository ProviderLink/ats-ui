import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckIcon, Trash2Icon, XIcon } from 'lucide-react';

interface EmailBulkBarProps {
  selectedCount: number;
  allSelected: boolean;
  confirming: boolean;
  onToggleAll: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onClear: () => void;
}

export function EmailBulkBar({
  selectedCount,
  allSelected,
  confirming,
  onToggleAll,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
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

      {confirming ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            Delete {selectedCount} email{selectedCount > 1 ? 's' : ''}?
          </span>
          <Button size="sm" variant="destructive" onClick={onConfirmDelete}>
            <CheckIcon className="size-4" /> Yes
          </Button>
          <Button size="sm" variant="outline" onClick={onCancelDelete}>
            <XIcon className="size-4" /> No
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onAskDelete}
        >
          <Trash2Icon className="size-4" />
          Delete selected
        </Button>
      )}

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

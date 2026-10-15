import { Button } from '@/components/ui/button';
import type { Candidate } from '@/store/types';
import { type Column } from '@tanstack/react-table';
import { ArrowUpDownIcon } from 'lucide-react';

export const SORT_BTN_CLS =
  '-ml-2 h-7 gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground';

export function SortHeader({
  column,
  label,
}: {
  column: Column<Candidate>;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={SORT_BTN_CLS}
      onClick={() => column.toggleSorting()}
    >
      {label} <ArrowUpDownIcon className="size-3" />
    </Button>
  );
}

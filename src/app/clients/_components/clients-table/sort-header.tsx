import { Button } from '@/components/ui/button';
import type { Client } from '@/store/types';
import type { Column } from '@tanstack/react-table';
import { ArrowUpDownIcon } from 'lucide-react';

interface SortHeaderProps {
  column: Column<Client>;
  label: string;
  icon?: React.ReactNode;
}

export function SortHeader({ column, label, icon }: SortHeaderProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-7 gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
      onClick={() => column.toggleSorting()}
    >
      {icon}
      {label} <ArrowUpDownIcon className="size-3" />
    </Button>
  );
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ArrowDownUpIcon, ChevronDownIcon } from 'lucide-react';
import { SORT_LABELS, type SortKey } from '../../_utils/job-candidates';

interface SortMenuProps {
  value: SortKey;
  onChange: (key: SortKey) => void;
}

const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[];

export function SortMenu({ value, onChange }: SortMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 h-7 rounded-full border border-dashed bg-card px-2.5 text-xs hover:bg-accent transition-colors',
            value !== 'default' && 'border-solid border-primary text-primary'
          )}
        >
          <ArrowDownUpIcon className="size-3" />
          {value === 'default' ? 'Sort' : `Sort: ${SORT_LABELS[value]}`}
          <ChevronDownIcon className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {SORT_KEYS.map(key => (
          <DropdownMenuItem
            key={key}
            onSelect={() => onChange(key)}
            className={cn(
              'text-sm',
              value === key && 'font-medium text-primary'
            )}
          >
            {key === 'default' ? 'Default' : SORT_LABELS[key]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

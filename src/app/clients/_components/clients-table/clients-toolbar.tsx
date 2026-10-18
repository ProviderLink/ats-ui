import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ClientStatus } from '@/store/types';
import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  CircleDotIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react';
import { SORT_LABELS, type SortOption } from '../../_utils/client-list';

const STATUS_FILTER_LABELS: Record<ClientStatus | 'all', string> = {
  all: 'All statuses',
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
};

const SORT_MENU: SortOption[] = [
  'default',
  'newest',
  'oldest',
  'mostOpenJobs',
  'leastOpenJobs',
  'mostJobs',
  'leastJobs',
];

const STATUS_FILTER_OPTIONS = ['all', 'active', 'inactive', 'suspended'] as const;

interface ClientsToolbarProps {
  query: string;
  onQueryChange: (v: string) => void;
  statusFilter: ClientStatus | 'all';
  onStatusFilterChange: (v: ClientStatus | 'all') => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  onAdd: () => void;
}

export function ClientsToolbar({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  onAdd,
}: ClientsToolbarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap shrink-0">
      <div className="relative flex-1 min-w-48 max-w-sm">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search clients..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          className="pl-8 h-9"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9 gap-1.5 rounded-full text-xs border-dashed',
              statusFilter !== 'all' &&
                'border-solid border-primary text-primary'
            )}
          >
            <CircleDotIcon className="size-3" />
            {STATUS_FILTER_LABELS[statusFilter]}
            <ChevronDownIcon className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {STATUS_FILTER_OPTIONS.map(s => (
            <DropdownMenuItem
              key={s}
              onSelect={() => onStatusFilterChange(s)}
              className={cn(
                'text-sm',
                statusFilter === s && 'font-medium text-primary'
              )}
            >
              {STATUS_FILTER_LABELS[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9 gap-1.5 rounded-full text-xs border-dashed',
              sortBy !== 'default' && 'border-solid border-primary text-primary'
            )}
          >
            <ArrowUpDownIcon className="size-3" />
            {sortBy === 'default' ? 'Sort' : SORT_LABELS[sortBy]}
            <ChevronDownIcon className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {SORT_MENU.map(opt => (
            <DropdownMenuItem
              key={opt}
              onSelect={() => onSortChange(opt)}
              className={cn(
                'text-sm',
                sortBy === opt && 'font-medium text-primary'
              )}
            >
              {SORT_LABELS[opt]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="ml-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onAdd}
                className="hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
              >
                <PlusIcon /> Add Client
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new client</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

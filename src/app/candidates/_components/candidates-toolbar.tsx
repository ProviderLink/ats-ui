import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ArrowUpDownIcon, ChevronDownIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CANDIDATE_SORT_LABELS, CANDIDATE_SORT_OPTIONS, type CandidateSortOption } from '../_utils/candidate-sort';
import type { CandidateTabValue } from '../_utils/candidate-tabs';
import { TabCountChip } from './tab-count-chip';

interface CandidatesToolbarProps {
  activeTab: CandidateTabValue;
  onTabChange: (tab: CandidateTabValue) => void;
  counts: { pending: number; approved: number };
  inputValue: string;
  onSearchChange: (q: string) => void;
  onClearSearch: () => void;
  sortBy: CandidateSortOption;
  onSortChange: (opt: CandidateSortOption) => void;
}

export function CandidatesToolbar({
  activeTab,
  onTabChange: handleTabChange,
  counts,
  inputValue,
  onSearchChange: handleSearchChange,
  onClearSearch: handleClearSearch,
  sortBy,
  onSortChange: handleSortChange,
}: CandidatesToolbarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 flex-wrap shrink-0">
      <Tabs
        value={activeTab}
        onValueChange={v => handleTabChange(v as CandidateTabValue)}
      >
        <TabsList>
          {[
            {
              value: 'pending' as const,
              label: 'In Review',
              count: counts.pending,
            },
            {
              value: 'approved' as const,
              label: 'In Pipeline',
              count: counts.approved,
            },
          ].map(({ value, label, count }) => (
            <TabsTrigger key={value} value={value}>
              {label} <TabCountChip n={count} />
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <div className="flex items-center gap-3 sm:ml-auto flex-wrap">
        <div className="relative min-w-48 max-w-sm flex-1 sm:flex-none">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search candidates..."
            value={inputValue}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-8 pr-8 h-9"
          />
          {inputValue && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 size-7"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" />
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 gap-1.5 rounded-full text-xs border-dashed',
                sortBy !== 'newest' &&
                  'border-solid border-primary text-primary'
              )}
            >
              <ArrowUpDownIcon className="size-3" />
              {CANDIDATE_SORT_LABELS[sortBy]}
              <ChevronDownIcon className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">
              Sort by
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CANDIDATE_SORT_OPTIONS.map(opt => (
              <DropdownMenuItem
                key={opt}
                onSelect={() => handleSortChange(opt)}
                className={cn(
                  'text-sm',
                  sortBy === opt && 'font-medium text-primary'
                )}
              >
                {CANDIDATE_SORT_LABELS[opt]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => navigate('/ats/candidates/quick-import')}
              >
                <PlusIcon />
                Add Candidate
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new candidate</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

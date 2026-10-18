import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

interface JobListHeaderProps {
  count: number;
  query: string;
  onQueryChange: (query: string) => void;
  onAdd: () => void;
}

export function JobListHeader({
  count,
  query,
  onQueryChange,
  onAdd,
}: JobListHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  function closeSearch() {
    setSearchOpen(false);
    onQueryChange('');
  }

  return (
    <div className="px-4 py-2 border-b flex items-center gap-1">
      {searchOpen ? (
        <div className="flex flex-1 items-center gap-2">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search jobs..."
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onBlur={e => {
              if (!e.target.value) closeSearch();
            }}
            className="h-8 flex-1 border-none shadow-none bg-transparent dark:bg-transparent pl-2 pr-0 text-sm focus-visible:ring-0"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={closeSearch}
            aria-label="Close search"
          >
            <XIcon />
          </Button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Jobs ({count})
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search jobs"
                >
                  <SearchIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search jobs</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" className="gap-1.5" onClick={onAdd}>
                  <PlusIcon className="size-3.5" />
                  Add Job
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add job</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  );
}

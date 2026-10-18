import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDownIcon, SearchIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useController, type Control } from 'react-hook-form';
import type { JobOption, QuickImportValues } from '../_utils/quick-import-form';

export function JobSearchSelect({
  jobs,
  control,
  name,
  error,
}: {
  jobs: JobOption[];
  control: Control<QuickImportValues>;
  name: 'jobId';
  error?: string;
}) {
  const { field } = useController({ control, name });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = jobs.find(j => j._id === field.value);

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        j.clientName.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  function select(id: string) {
    field.onChange(id);
    setSearch('');
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    field.onChange('');
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className={`flex w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${error ? 'border-destructive' : 'border-input'}`}
          >
            {selected ? (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">{selected.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {selected.clientName}
                </p>
              </div>
            ) : (
              <span className="text-muted-foreground">
                Search and select a job...
              </span>
            )}
            <div className="flex items-center gap-0.5 shrink-0 ml-2">
              {field.value && (
                <span
                  role="button"
                  className="rounded p-0.5 hover:bg-muted"
                  onPointerDown={clear}
                >
                  <XIcon className="size-3.5 text-muted-foreground" />
                </span>
              )}
              <ChevronsUpDownIcon className="size-3.5 text-muted-foreground shrink-0" />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-96 p-0"
          align="start"
          onPointerDownOutside={e => {
            // Don't close when clicking inside the popover
            const target = e.target as HTMLElement;
            if (target.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex items-center border-b px-3 py-2">
            <SearchIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring rounded"
              placeholder="Search by title or client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No jobs found.
              </p>
            ) : (
              filtered.map(job => (
                <button
                  key={job._id}
                  type="button"
                  className={`flex w-full flex-col rounded-sm px-3 py-2.5 text-left transition-colors hover:bg-accent ${job._id === field.value ? 'bg-primary/10 border-l-2 border-l-primary rounded-l-none' : ''}`}
                  onPointerDown={e => {
                    e.preventDefault();
                    select(job._id);
                  }}
                >
                  <span
                    className={`text-sm ${job._id === field.value ? 'font-semibold' : 'font-medium'}`}
                  >
                    {job.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {job.clientName}
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

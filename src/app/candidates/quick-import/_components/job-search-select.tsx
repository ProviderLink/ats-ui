import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { keywordFilter } from '@/lib/command-filter';
import { ChevronsUpDownIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
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

  const selected = jobs.find(j => j._id === field.value);

  function select(id: string) {
    field.onChange(id);
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
        <PopoverContent className="w-96 p-0" align="start">
          <Command filter={keywordFilter}>
            <CommandInput placeholder="Search by title or client..." />
            <CommandList>
              <CommandEmpty>No jobs found.</CommandEmpty>
              {jobs.map(job => (
                <CommandItem
                  key={job._id}
                  value={job._id}
                  keywords={[job.title, job.clientName]}
                  onSelect={() => select(job._id)}
                  className={`flex-col items-start gap-0 px-3 py-2.5 ${job._id === field.value ? 'bg-primary/10 border-l-2 border-l-primary rounded-l-none' : ''}`}
                >
                  <span
                    className={`text-sm ${job._id === field.value ? 'font-semibold' : 'font-medium'}`}
                  >
                    {job.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {job.clientName}
                  </span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
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

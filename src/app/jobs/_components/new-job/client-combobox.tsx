import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Client } from '@/store';
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

interface ClientComboboxProps {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
}

export function ClientCombobox({
  clients,
  value,
  onChange,
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = clients.find(c => c._id === value);
  const filtered = search.trim()
    ? clients.filter(c =>
        c.companyName.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSearch('');
  }

  function handleSelect(id: string) {
    onChange(id);
    handleOpenChange(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full flex items-center justify-between h-9 px-3 rounded-md border bg-background text-sm ring-offset-background',
            'hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            !selected && 'text-muted-foreground'
          )}
        >
          <span className="truncate">
            {selected?.companyName ?? 'Select client'}
          </span>
          <ChevronDownIcon
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground ml-2 transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            aria-label="Search clients"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring rounded"
            autoFocus
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch('')}
              className="text-muted-foreground/50 hover:text-foreground"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>
        <div className="max-h-52 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No clients found
            </p>
          ) : (
            filtered.map(c => (
              <button
                key={c._id}
                type="button"
                onClick={() => handleSelect(c._id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left',
                  value === c._id && 'bg-accent/50'
                )}
              >
                <CheckIcon
                  className={cn(
                    'size-3.5 shrink-0',
                    value === c._id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="truncate">{c.companyName}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

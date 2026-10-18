import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { keywordFilter } from '@/lib/command-filter';
import { cn } from '@/lib/utils';
import type { Client } from '@/store';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
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
  const selected = clients.find(c => c._id === value);

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <Command filter={keywordFilter}>
          <CommandInput placeholder="Search clients..." />
          <CommandList>
            <CommandEmpty>No clients found</CommandEmpty>
            {clients.map(c => (
              <CommandItem
                key={c._id}
                value={c._id}
                keywords={[c.companyName]}
                onSelect={() => handleSelect(c._id)}
                className={cn(value === c._id && 'bg-accent/50')}
              >
                <CheckIcon
                  className={cn(
                    'size-3.5',
                    value === c._id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="truncate">{c.companyName}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

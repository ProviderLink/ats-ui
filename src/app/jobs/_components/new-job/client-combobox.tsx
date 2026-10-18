import { cn } from '@/lib/utils';
import type { Client } from '@/store';
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function ClientCombobox({
  clients,
  value,
  onChange,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = clients.find(c => c._id === value);
  const filtered = search.trim()
    ? clients.filter(c =>
        c.companyName.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setSearch('');
  }

  function handleToggle() {
    setOpen(o => {
      if (!o) setTimeout(() => inputRef.current?.focus(), 30);
      else setSearch('');
      return !o;
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
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

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md">
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring rounded"
            />
            {search && (
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  setSearch('');
                }}
                className="text-muted-foreground/50 hover:text-foreground"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
          <div
            style={{ maxHeight: '200px', overflowY: 'scroll' }}
            className="py-1"
          >
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No clients found
              </p>
            ) : (
              filtered.map(c => (
                <button
                  key={c._id}
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    handleSelect(c._id);
                  }}
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
        </div>
      )}
    </div>
  );
}

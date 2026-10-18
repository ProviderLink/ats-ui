import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Tag } from '@/store/types';
import { FilterIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

interface TagFilterProps {
  allTags: Tag[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function TagFilter({ allTags, selected, onChange }: TagFilterProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return allTags;
    const q = search.toLowerCase();
    return allTags.filter(t => t.name.toLowerCase().includes(q));
  }, [allTags, search]);

  const toggle = (id: string) =>
    onChange(
      selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <FilterIcon className="size-3.5" />
          Tags
          {selected.length > 0 && (
            <Badge
              variant="secondary"
              className="h-4 px-1.5 text-[10px] rounded-full"
            >
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <div className="flex flex-col">
          <div className="p-2 border-b">
            <Input
              placeholder="Search tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                {allTags.length === 0
                  ? 'No tags available'
                  : 'No matching tags'}
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {filtered.map(tag => (
                  <button
                    key={tag._id}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-muted transition-colors',
                      selected.includes(tag._id) && 'bg-muted'
                    )}
                    onClick={() => toggle(tag._id)}
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 truncate">{tag.name}</span>
                    {selected.includes(tag._id) && (
                      <XIcon className="size-3 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selected.length > 0 && (
            <div className="border-t px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {selected.length} selected
                </span>
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => onChange([])}
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

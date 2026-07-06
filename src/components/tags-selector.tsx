'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Tag } from '@/store/types';
import { PlusIcon, SearchIcon, Tags as TagsIcon, XIcon } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { useState } from 'react';

type Props = {
  allTags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  compact?: boolean;
};

export function TagsSelector({ allTags, selectedIds, onChange, compact }: Props) {
  const [search, setSearch] = useState('');
  const selected = allTags.filter(t => selectedIds.includes(t._id));

  const filtered = search.trim()
    ? allTags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : allTags;

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id]
    );
  }

  const popoverContent = (
    <PopoverPrimitive.Content
      align="start"
      sideOffset={4}
      className={cn(
        'bg-popover text-popover-foreground z-50 w-56 rounded-md border p-2 shadow-md outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
      )}
    >
      {allTags.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          No tags available
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="relative mb-1">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tags…"
              className="h-7 pl-6 text-xs"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No tags found
            </p>
          ) : (
            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto overscroll-contain">
              {filtered.map(tag => (
                <label
                  key={tag._id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent text-sm"
                >
                  <Checkbox
                    checked={selectedIds.includes(tag._id)}
                    onCheckedChange={() => toggle(tag._id)}
                  />
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </PopoverPrimitive.Content>
  );

  if (compact) {
    return (
      <PopoverPrimitive.Root onOpenChange={open => { if (!open) setSearch(''); }}>
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.map(tag => (
            <span
              key={tag._id}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-opacity"
              style={{
                borderColor: tag.color,
                color: tag.color,
                backgroundColor: tag.color + '20',
              }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => toggle(tag._id)}
                className="hover:opacity-60 transition-opacity"
              >
                <XIcon className="size-2.5" />
              </button>
            </span>
          ))}
          <PopoverPrimitive.Trigger asChild>
            {selected.length === 0 ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
              >
                <TagsIcon className="size-3" />
                Add tags
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex size-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
              >
                <PlusIcon className="size-3" />
              </button>
            )}
          </PopoverPrimitive.Trigger>
        </div>
        {popoverContent}
      </PopoverPrimitive.Root>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <PopoverPrimitive.Root
        onOpenChange={open => {
          if (!open) setSearch('');
        }}
      >
        <PopoverPrimitive.Trigger asChild>
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="w-full justify-start gap-1.5 border-dashed"
          >
            <PlusIcon className="size-3.5" />
            Add tags
          </Button>
        </PopoverPrimitive.Trigger>
        {popoverContent}
      </PopoverPrimitive.Root>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(tag => (
            <Badge
              key={tag._id}
              variant="outline"
              className="text-xs gap-1 pr-1"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => toggle(tag._id)}
                className="hover:opacity-60"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

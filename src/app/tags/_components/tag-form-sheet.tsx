import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Palette } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Tag } from '@/store/types';
import { PRESET_COLORS } from '../_data/tags';
import { TagBadge } from './tag-badge';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag;
  onSave: (name: string, color: string) => void;
};

export function TagFormSheet({ open, onOpenChange, tag, onSave }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [hexInput, setHexInput] = useState(PRESET_COLORS[0]);
  useEffect(() => {
    if (open) {
      setName(tag?.name ?? '');
      const initial = tag?.color ?? PRESET_COLORS[0];
      setColor(initial);
      setHexInput(initial);
    }
  }, [open, tag]);

  function handleHexChange(value: string) {
    setHexInput(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) setColor(value);
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, color);
    onOpenChange(false);
  }

  const isEditing = !!tag;
  const canSave = name.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 w-[360px]">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{isEditing ? 'Edit Tag' : 'New Tag'}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tag-name">Tag name</Label>
            <Input
              id="tag-name"
              placeholder="e.g. High Priority"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Color</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c);
                    setHexInput(c);
                  }}
                  className={cn(
                    'size-6 rounded-full border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    color === c
                      ? 'border-foreground scale-110 shadow-sm'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className="size-6 rounded border shrink-0"
                style={{ background: color }}
              />
              <Input
                value={hexInput}
                onChange={e => handleHexChange(e.target.value)}
                placeholder="#3b82f6"
                className="font-mono text-xs h-7 flex-1"
                maxLength={7}
              />
              <div className="relative shrink-0">
                <input
                  type="color"
                  value={color}
                  onChange={e => {
                    setColor(e.target.value);
                    setHexInput(e.target.value);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  tabIndex={-1}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs pointer-events-none"
                  tabIndex={-1}
                >
                  <Palette className="size-3" />
                  Custom
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Preview</Label>
            <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center gap-3">
              <TagBadge name={name} color={color} />
              <span className="text-xs text-muted-foreground">
                How it appears across the app
              </span>
            </div>
          </div>
        </div>

        <SheetFooter className="border-t px-6 py-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEditing ? 'Save changes' : 'Create tag'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

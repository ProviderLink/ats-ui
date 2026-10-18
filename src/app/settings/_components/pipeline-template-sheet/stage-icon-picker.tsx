import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  FALLBACK_STAGE_ICON,
  STAGE_ICON_GROUPS,
  STAGE_ICONS,
} from '../../_utils/stage-icons';

interface StageIconPickerProps {
  value: string;
  onChange: (name: string) => void;
}

export function StageIconPicker({ value, onChange }: StageIconPickerProps) {
  const [open, setOpen] = useState(false);
  const Icon = STAGE_ICONS[value] ?? FALLBACK_STAGE_ICON;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="size-8 rounded-md border border-input bg-muted flex items-center justify-center hover:bg-accent transition-colors"
          title="Pick icon"
          aria-label="Pick icon"
        >
          <Icon className="size-4 text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2 flex flex-col gap-1.5">
        {STAGE_ICON_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs text-muted-foreground px-1 mb-0.5">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-0.5">
              {group.icons.map(name => {
                const Ic = STAGE_ICONS[name] ?? FALLBACK_STAGE_ICON;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    aria-label={name}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                    }}
                    className={cn(
                      'size-7 rounded flex items-center justify-center transition-colors hover:bg-accent',
                      value === name && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <Ic className="size-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

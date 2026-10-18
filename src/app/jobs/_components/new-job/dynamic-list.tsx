import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, XIcon } from 'lucide-react';

export function DynamicList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/50 w-4 text-right shrink-0 tabular-nums select-none">
            {i + 1}.
          </span>
          <Input
            value={item}
            onChange={e => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="shrink-0 text-muted-foreground/40 hover:text-destructive"
            aria-label={`Remove item ${i + 1}`}
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-1.5 border-dashed text-muted-foreground hover:text-foreground mt-0.5"
        onClick={() => onChange([...items, ''])}
      >
        <PlusIcon className="size-3.5" />
        Add item
      </Button>
    </div>
  );
}

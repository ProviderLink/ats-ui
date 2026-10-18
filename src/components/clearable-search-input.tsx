import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchIcon, XIcon } from 'lucide-react';

interface ClearableSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
}

export function ClearableSearchInput({
  value,
  onChange,
  onClear,
  placeholder,
}: ClearableSearchInputProps) {
  return (
    <div className="relative min-w-48 max-w-sm flex-1">
      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-8 pr-8 h-9"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-0.5 top-1/2 -translate-y-1/2 size-7"
          onClick={onClear}
          aria-label="Clear search"
        >
          <XIcon className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

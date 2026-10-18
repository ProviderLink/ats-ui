import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface FilterOptionsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function FilterOptions<T extends string>({
  options,
  value,
  onChange,
}: FilterOptionsProps<T>) {
  return options.map(o => (
    <DropdownMenuItem
      key={o.value}
      onSelect={() => onChange(o.value)}
      className={cn('text-sm', value === o.value && 'font-medium text-primary')}
    >
      {o.label}
    </DropdownMenuItem>
  ));
}

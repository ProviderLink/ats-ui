import { cn } from '@/lib/utils';

interface ActivityFilterTabsProps {
  filters: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}

export function ActivityFilterTabs({
  filters,
  value,
  onChange,
}: ActivityFilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Activity view">
      {[{ id: 'all', label: 'All' }, ...filters].map(f => (
        <button
          key={f.id}
          type="button"
          role="tab"
          aria-selected={value === f.id}
          onClick={() => onChange(f.id)}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs transition-colors',
            value === f.id
              ? 'bg-gray-200 font-medium text-foreground dark:bg-muted'
              : 'text-gray-600 hover:bg-gray-100 hover:text-foreground dark:text-muted-foreground dark:hover:bg-transparent'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

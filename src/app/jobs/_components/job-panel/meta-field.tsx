import { cn } from '@/lib/utils';

interface MetaFieldProps {
  label: string;
  value: React.ReactNode;
  destructive?: boolean;
}

export function MetaField({ label, value, destructive }: MetaFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
        {label}
      </p>
      <div
        className={cn('text-sm font-medium', destructive && 'text-destructive')}
      >
        {value}
      </div>
    </div>
  );
}

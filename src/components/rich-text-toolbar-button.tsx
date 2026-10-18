import { cn } from '@/lib/utils';

export function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground disabled:opacity-40',
        active && 'bg-accent text-foreground'
      )}
    >
      {children}
    </button>
  );
}

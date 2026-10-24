interface AccountTabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export function AccountTabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: AccountTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-card text-foreground shadow-sm ring-1 ring-gray-300 dark:ring-border-subtle'
          : 'text-gray-600 hover:text-foreground hover:bg-gray-100 dark:text-muted-foreground dark:hover:bg-muted/60'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

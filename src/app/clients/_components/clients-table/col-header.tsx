interface ColHeaderProps {
  label: string;
  icon?: React.ReactNode;
}

export function ColHeader({ label, icon }: ColHeaderProps) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

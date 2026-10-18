export function ColHeader({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
